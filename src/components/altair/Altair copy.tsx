import { type FunctionDeclaration, Type } from "@google/genai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import { soapNoteDeclaration, generateSoapNoteMarkdown } from "../soap-notes/SoapNote";
import { useSoapNote } from "../../contexts/SoapNoteContext";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

// New medical search function declaration
const medvisorSearchDeclaration: FunctionDeclaration = {
  name: "medvisor_search",
  description: "Searches for medical information from trusted sources like NIH using a specialized medical search engine.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The medical search query. Be specific about symptoms, conditions, treatments, or medications.",
      },
    },
    required: ["query"],
  },
};

// Update the DailyMed API function declaration to be more user-friendly
const dailyMedApiDeclaration: FunctionDeclaration = {
  name: "dailymed_api",
  description: "Search for FDA-approved drug information from the NIH DailyMed database",
  parameters: {
    type: Type.OBJECT,
    properties: {
      search_term: {
        type: Type.STRING,
        description: "Drug name, class name, or other search term. The system will automatically determine whether to search drug names or drug classes.",
      },
      setid: {
        type: Type.STRING,
        description: "Optional: SetID for specific drug information (for detailed information lookup)",
      },
      name_type: {
        type: Type.STRING,
        description: "Optional: When searching drug names, specify generic, brand, or both",
        enum: ["generic", "brand", "both"],
      },
      page: {
        type: Type.NUMBER,
        description: "Optional: Page number for results",
      },
      pagesize: {
        type: Type.NUMBER,
        description: "Optional: Results per page (max 100)",
      }
    },
    required: ["search_term"],
  },
};

// Helper function to fetch medical search results
async function fetchMedicalSearchResults(query: string) {
  try {
    // Using the correct API key
    const apiKey = "AIzaSyAIO6wovAUWCyvWPR1MMUH5tK84LW8Molw";
    const cx = "029adc5d670404e1f"; // Your custom search engine ID
    
    console.log(`🔍 Searching for: "${query}" with engine ID: ${cx}`);
    
    // Prepare search parameters similar to the Python implementation
    const params = new URLSearchParams({
      key: apiKey,
      cx: cx,
      q: query,
      num: "5", // Number of results
      safe: "active",
      gl: "us", // Geographic location
      fields: "items(title,snippet,link,displayLink,pagemap)",
      lr: "lang_en", // Language restriction
    });
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Search API error: ${response.status}`, errorText);
      throw new Error(`Search request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Search results:", data);
    
    if (!data.items || data.items.length === 0) {
      console.log("No search results found");
      return [];
    }
    
    // Format results similar to the Python implementation
    const formattedResults = data.items.map((item: any) => {
      const meta = item.pagemap || {};
      const metatags = (meta.metatags && meta.metatags[0]) || {};
      
      return {
        title: item.title || "",
        snippet: item.snippet || "",
        link: item.link || "",
        source: item.displayLink || "",
        metadata: {
          description: metatags["og:description"] || "",
          site_name: metatags["og:site_name"] || "",
          type: metatags["og:type"] || "",
          published_date: metatags["article:published_time"] || ""
        }
      };
    });
    
    console.log(`Found ${formattedResults.length} search results`);
    return formattedResults;
  } catch (error) {
    console.error("Error fetching medical search results:", error);
    return [];
  }
}

// Helper function to format search results for the AI
function formatResultsForPrompt(results: any[]): string {
  if (!results || results.length === 0) {
    return "No relevant medical information found.";
  }
  
  let formatted = "\nRelevant medical information:\n";
  
  results.forEach((result, i) => {
    formatted += `\n[${i + 1}] ----------------------------------------`;
    formatted += `\nSource: ${result.source}`;
    formatted += `\nTitle: ${result.title}`;
    formatted += `\nSummary: ${result.snippet}`;
    formatted += `\nURL: ${result.link}`;
    
    // Add metadata if available
    const metadata = result.metadata || {};
    if (metadata.description) {
      formatted += `\nDetailed Description: ${metadata.description}`;
    }
    if (metadata.published_date) {
      formatted += `\nPublished: ${metadata.published_date}`;
    }
    
    formatted += "\n";
  });
  
  return formatted;
}

// Helper function to query DailyMed API
async function queryDailyMedApi(endpoint: string, params: Record<string, any>) {
  // Base URL for DailyMed API
  const baseUrl = "https://dailymed.nlm.nih.gov/dailymed/services/v2";
  let url = `${baseUrl}/${endpoint}.json`;
  
  // Handle SETID in URL if needed
  if (params.setid && (endpoint === "spls" || endpoint === "packaging")) {
    // For SPL and packaging endpoints that need SetID in path
    if (endpoint === "spls") {
      url = `${baseUrl}/spls/${params.setid}.json`;
    } else if (endpoint === "packaging") {
      url = `${baseUrl}/spls/${params.setid}/packaging.json`;
    }
  }
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Handle endpoint-specific parameters
  if (endpoint === "drugnames" && params.search_term) {
    queryParams.append("drug_name", params.search_term);
    if (params.name_type) {
      // Convert to API format (g/b/both)
      const nameType = params.name_type === "generic" ? "g" : 
                      params.name_type === "brand" ? "b" : "both";
      queryParams.append("name_type", nameType);
    }
  } else if (endpoint === "drugclasses" && params.search_term) {
    queryParams.append("class_name", params.search_term);
  }
  
  // Add pagination parameters
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pagesize) queryParams.append("pagesize", params.pagesize.toString());
  
  // Add query string to URL
  const queryString = queryParams.toString();
  if (queryString && !url.includes("?")) {
    url = `${url}?${queryString}`;
  }
  
  console.log(`Querying DailyMed API: ${url}`);
  
  // Make the API request
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DailyMed API error: ${response.status}`, errorText);
      throw new Error(`DailyMed request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("DailyMed results:", data);
    
    // Add additional check for empty results
    if (data.data && Array.isArray(data.data) && data.data.length === 0) {
      // If we got no results and this is a brand name search, try again case-insensitive
      if (endpoint === "drugnames" && params.name_type === "brand") {
        // Try with capitalized first letter
        const capitalizedSearchTerm = params.search_term.charAt(0).toUpperCase() + params.search_term.slice(1);
        if (capitalizedSearchTerm !== params.search_term) {
          console.log(`No results found, trying with capitalized term: ${capitalizedSearchTerm}`);
          // Create a new object to avoid modifying the original params
          const newParams = { ...params, search_term: capitalizedSearchTerm };
          return queryDailyMedApi(endpoint, newParams);
        }
        
        // Try with all uppercase
        const upperSearchTerm = params.search_term.toUpperCase();
        if (upperSearchTerm !== params.search_term && upperSearchTerm !== capitalizedSearchTerm) {
          console.log(`No results found, trying with uppercase term: ${upperSearchTerm}`);
          const newParams = { ...params, search_term: upperSearchTerm };
          return queryDailyMedApi(endpoint, newParams);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error querying DailyMed API:", error);
    return { error: `Failed to fetch drug information: ${error}` };
  }
}

// Format DailyMed API results for AI consumption
function formatDailyMedResults(data: any, endpoint: string, searchTerm?: string, setid?: string): string {
  if (!data || data.error) {
    return `No drug information found. Error: ${data?.error || 'Unknown error'}`;
  }
  
  if (data.data && Array.isArray(data.data) && data.data.length === 0) {
    return `No results found for "${searchTerm || ''}" in ${endpoint}.`;
  }
  
  let formatted = `\nDrug Information from DailyMed (NIH):\n`;
  
  // Add metadata if available
  if (data.metadata) {
    formatted += `\nPage ${data.metadata.current_page || '1'} of ${data.metadata.total_pages || '1'}`;
    formatted += `\nTotal results: ${data.metadata.total_elements || data.data?.length || 0}\n`;
  }
  
  switch (endpoint) {
    case "drugnames":
      formatted += `\n📋 Drug Names matching "${searchTerm || ''}":\n`;
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any, i: number) => {
          formatted += `\n[${i + 1}] ${item.drug_name}`;
          if (item.name_type) formatted += ` (${item.name_type === 'b' ? 'Brand' : 'Generic'})`;
          if (item.manufacturer) formatted += `\n   Manufacturer: ${item.manufacturer}`;
          if (item.setid) formatted += `\n   SetID: ${item.setid}`;
        });
      }
      break;
      
    case "drugclasses":
      formatted += `\n📋 Drug Classes${searchTerm ? ` matching "${searchTerm}"` : ''}:\n`;
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any, i: number) => {
          formatted += `\n[${i + 1}] ${item.name}`;
          if (item.type) formatted += ` (${item.type})`;
          if (item.code) formatted += `\n   Code: ${item.code}`;
        });
      }
      break;
      
    case "spls":
      formatted += `\n📋 Drug Label Information for SetID: ${setid || data.setid || 'Unknown'}\n`;
      // SPL data is complex XML, simplified here
      if (data.title) formatted += `\nTitle: ${data.title}`;
      if (data.setid) formatted += `\nSetID: ${data.setid}`;
      if (data.version_number) formatted += `\nVersion: ${data.version_number}`;
      
      formatted += `\n\nNote: SPL data contains detailed drug information in XML format.`;
      break;
      
    case "packaging":
      formatted += `\n📋 Drug Packaging Information for SetID: ${setid || data.data?.setid || 'Unknown'}\n`;
      if (data.data && data.data.products) {
        data.data.products.forEach((product: any, i: number) => {
          formatted += `\n[${i + 1}] ${product.product_name || 'Unknown Product'}`;
          if (product.product_name_generic) formatted += ` (${product.product_name_generic})`;
          
          // Add active ingredients
          if (product.active_ingredients && product.active_ingredients.length > 0) {
            formatted += `\n   Active Ingredients:`;
            product.active_ingredients.forEach((ingredient: any) => {
              formatted += `\n   - ${ingredient.name}: ${ingredient.strength}`;
            });
          }
          
          // Add packaging info
          if (product.packaging && product.packaging.length > 0) {
            formatted += `\n   Packaging:`;
            product.packaging.forEach((pkg: any) => {
              if (pkg.ndc) formatted += `\n   - NDC: ${pkg.ndc}`;
              if (pkg.package_descriptions && pkg.package_descriptions.length > 0) {
                pkg.package_descriptions.forEach((desc: string) => {
                  formatted += `\n     Description: ${desc}`;
                });
              }
            });
          }
        });
      }
      break;
      
    default:
      formatted += `\n📋 Results for ${endpoint}${searchTerm ? ` related to "${searchTerm}"` : ''}:\n`;
      formatted += `\nRaw data: ${JSON.stringify(data, null, 2)}`;
  }
  
  if (endpoint === "drugnames" && data.data && data.data.length > 0) {
    formatted += `\n\n💊 To get detailed information about a specific drug, use the SetID with the 'spls' endpoint.`;
  }
  
  return formatted;
}

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();
  const { updateSoapNote } = useSoapNote();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.5-flash-preview-native-audio-dialog",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: "Aoede" 
            } 
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `

You are an AI remote doctor designed to provide comprehensive, efficient, and compassionate medical services. Your capabilities include performing differential diagnoses, suggesting treatments, prescribing medications, and referring patients to specialists when needed. Your goal is to help patients understand their health conditions and guide them toward appropriate care while ensuring their privacy and data security.

Workflow

	1.	Consultation and Differential Diagnosis:
	•	Start by asking about the patient's main symptoms, their duration, severity, and relevant medical history (e.g., allergies, chronic conditions, current medications).
	•	List possible diagnoses and ask specific follow-up questions to narrow them down, e.g., "Is your cough dry or productive?" or "Have you noticed any swelling?"
	•	Continue until you can suggest one or a few likely diagnoses.
	2.	Diagnosis and Risk Assessment:
	•	Confirm the most likely diagnosis and assess its severity.
	•	For emergencies (e.g., chest pain suggesting a heart attack), immediately advise seeking emergency care and offer first-aid tips if applicable.
	3.	Treatment and Prescriptions:
	•	For non-emergencies, provide tailored advice:
	•	Medications: Include drug name, dosage, and instructions.
	•	Lifestyle Tips: Suggest diet, rest, or exercise changes.
	•	Other Guidance: Offer self-care or mental health support.
	•	Check for drug interactions or allergies before prescribing.
	4.	Referrals and Follow-Up:
	•	If the condition requires a specialist, recommend a referral and assist with next steps.
	•	Suggest a follow-up plan to monitor progress.
	5.	Education and Monitoring:
	•	Share simple educational materials to help patients manage their condition.
	•	Use data from wearable devices (if available) to refine advice.

Documentation:
• Maintain medical documentation by ACTIVELY and CONTINUOUSLY updating the Medical Note
• Update the Medical Note IMMEDIATELY after each patient statement and each of your responses
• Update the note even for brief statements - continuous documentation builds engagement
• Call the update_soap_note function frequently (at least once every few exchanges)
• Show users their information is being captured in real-time to increase trust

Interaction Guidelines

	•	Usability: Use clear, simple language. Avoid jargon unless explaining it (e.g., "Hypertension means high blood pressure").
	•	Trustworthiness: Be transparent about limitations ("I'm confident in this diagnosis, but if symptoms worsen, please see a doctor in person"). Optionally include ICD-10-CM codes for credibility, e.g., "This is classified as J45.909, or mild asthma."
	•	Kindness: Show empathy and patience ("I'm sorry you're feeling this way. Let's figure it out together."). Reassure the patient throughout.

Safety and Privacy

	•	Verify the patient's identity and get consent before accessing data.
	•	Encrypt all data and comply with medical privacy laws.
	•	If uncertain, recommend consulting a human doctor.

Start the Conversation

Begin by saying: "Hello! I'm here to help you with your health concerns. What symptoms are you experiencing today?"
"`
          },
        ],
      },
      tools: [
        // Basic Google Search as fallback
        { googleSearch: {} },
        // Include all function declarations
        { functionDeclarations: [declaration, medvisorSearchDeclaration, dailyMedApiDeclaration, soapNoteDeclaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = async (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      
      // Check if any function calls exist
      if (!toolCall.functionCalls.length) {
        return;
      }
      
      // Process responses for each function call
      const functionResponses = await Promise.all(
        toolCall.functionCalls.map(async (fc) => {
          // Handle Altair graph rendering
          if (fc.name === declaration.name) {
            const str = (fc.args as any).json_graph;
            setJSONString(str);
            return {
              response: { output: { success: true } },
              id: fc.id,
            };
          }
          
          // Handle medical search queries
          if (fc.name === medvisorSearchDeclaration.name) {
            const query = (fc.args as any).query;
            console.log(`\n${"=".repeat(50)}`);
            console.log(`🔍 SEARCH PROCESS`);
            console.log(`${"=".repeat(50)}`);
            console.log(`\n1️⃣ Original search query: '${query}'`);
            
            try {
              const searchResults = await fetchMedicalSearchResults(query);
              
              // Create formatted context for the AI
              const formattedContext = formatResultsForPrompt(searchResults);
              
              console.log(`\n4️⃣ Formatted search context:`);
              console.log(`${"-".repeat(50)}`);
              console.log(formattedContext);
              console.log(`${"-".repeat(50)}`);
              
              return {
                response: { 
                  output: { 
                    success: true,
                    results: searchResults,
                    formatted_context: formattedContext
                  } 
                },
                id: fc.id,
              };
            } catch (error) {
              console.error("Error in medical search:", error);
              return {
                response: { 
                  output: { 
                    success: false,
                    error: "Failed to perform medical search"
                  } 
                },
                id: fc.id,
              };
            }
          }
          
          // Handle DailyMed API queries
          if (fc.name === dailyMedApiDeclaration.name) {
            const { search_term, setid, name_type, page, pagesize } = fc.args as any;
            
            console.log(`\n${"=".repeat(50)}`);
            console.log(`🔍 DAILYMED API QUERY`);
            console.log(`${"=".repeat(50)}`);
            console.log(`\nSearch term: ${search_term}`);
            if (setid) console.log(`SetID: ${setid}`);
            
            try {
              let combinedResults = "";
              let successCount = 0;
              
              // If setid is provided, get specific drug information
              if (setid) {
                // First try to get basic SPL info
                const splResults = await queryDailyMedApi("spls", { setid });
                if (!splResults.error) {
                  combinedResults += formatDailyMedResults(splResults, "spls", search_term, setid);
                  successCount++;
                }
                
                // Then try to get packaging info
                const packagingResults = await queryDailyMedApi("packaging", { setid });
                if (!packagingResults.error) {
                  combinedResults += "\n\n" + formatDailyMedResults(packagingResults, "packaging", search_term, setid);
                  successCount++;
                }
              } 
              // If no setid, search both drug names and classes
              else {
                // Search drug names first - try both brand and generic if not specified
                let nameParams: {
                  search_term: any;
                  name_type?: any;
                  page: number;
                  pagesize: number;
                } = { 
                  search_term, 
                  page: page || 1,
                  pagesize: pagesize || 10
                };
                
                // Apply name_type if provided
                if (name_type) {
                  nameParams.name_type = name_type;
                }
                
                const nameResults = await queryDailyMedApi("drugnames", nameParams);
                
                // Search drug classes second
                const classResults = await queryDailyMedApi("drugclasses", { 
                  search_term,
                  page: page || 1,
                  pagesize: pagesize || 10
                });
                
                // Combine results
                if (!nameResults.error && nameResults.data && Array.isArray(nameResults.data) && nameResults.data.length > 0) {
                  combinedResults += formatDailyMedResults(nameResults, "drugnames", search_term);
                  successCount++;
                }
                
                if (!classResults.error && classResults.data && Array.isArray(classResults.data) && classResults.data.length > 0) {
                  if (combinedResults) combinedResults += "\n\n";
                  combinedResults += formatDailyMedResults(classResults, "drugclasses", search_term);
                  successCount++;
                }
                
                // If no successful results found in either search
                if (successCount === 0) {
                  // If we have a brand name but no results, suggest trying generic name
                  if (name_type === "brand") {
                    combinedResults = `No brand name medication found for "${search_term}". This may be a generic medication or the brand name might be spelled differently. Try searching without specifying brand name.`;
                  } else {
                    combinedResults = `No drug information found for "${search_term}". Please check the spelling or try a different search term.`;
                  }
                }
              }
              
              console.log(`\nFormatted DailyMed results:`);
              console.log(`${"-".repeat(50)}`);
              console.log(combinedResults);
              console.log(`${"-".repeat(50)}`);
              
              return {
                response: { 
                  output: { 
                    success: successCount > 0,
                    formatted_context: combinedResults
                  } 
                },
                id: fc.id,
              };
            } catch (error) {
              console.error("Error in DailyMed API query:", error);
              return {
                response: { 
                  output: { 
                    success: false,
                    error: `Failed to retrieve drug information: ${error}`,
                    formatted_context: `Unable to find drug information for "${search_term}" due to a technical error. Please try again with a different search term.`
                  } 
                },
                id: fc.id,
              };
            }
          }
          
          // Handle SOAP note updates
          if (fc.name === soapNoteDeclaration.name) {
            console.log(`\n${"=".repeat(50)}`);
            console.log(`📝 UPDATING SOAP NOTE`);
            console.log(`${"=".repeat(50)}`);
            
            try {
              const soapNoteData = fc.args as any;
              console.log("SOAP Note Update Data:", soapNoteData);
              
              // Handle backward compatibility for subjective/objective fields
              const updatedData = {...soapNoteData};
              
              // If we have new fields but the old context is looking for subjective/objective
              if (updatedData.historyOfPresentIllness && !updatedData.subjective) {
                updatedData.subjective = updatedData.historyOfPresentIllness;
              }
              
              if (updatedData.physicalExam && !updatedData.objective) {
                updatedData.objective = updatedData.physicalExam;
              }
              
              // Update the SOAP note in the context
              updateSoapNote(updatedData);
              
              return {
                response: { 
                  output: { 
                    success: true,
                    message: "SOAP note updated successfully."
                  } 
                },
                id: fc.id,
              };
            } catch (error) {
              console.error("Error updating SOAP note:", error);
              return {
                response: { 
                  output: { 
                    success: false,
                    error: "Failed to update SOAP note"
                  } 
                },
                id: fc.id,
              };
            }
          }
          
          // Default response for unknown function calls
          return {
            response: { output: { success: false, error: "Unknown function" } },
            id: fc.id,
          };
        })
      );
      
      // Send tool responses back to the model
      client.sendToolResponse({ functionResponses });
    };
    
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, updateSoapNote]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  
  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);