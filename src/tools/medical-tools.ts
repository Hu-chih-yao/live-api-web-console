import { FunctionDeclaration, Type } from "@google/genai";

export const medvisorSearchDeclaration: FunctionDeclaration = {
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

export const dailyMedApiDeclaration: FunctionDeclaration = {
  name: "dailymed_api",
  description: "Search for FDA-approved drug information from the NIH DailyMed database",
  parameters: {
    type: Type.OBJECT,
    properties: {
      search_term: {
        type: Type.STRING,
        description: "Drug name, class name, or other search term",
      },
      setid: {
        type: Type.STRING,
        description: "Optional: SetID for specific drug information",
      },
      name_type: {
        type: Type.STRING,
        description: "Optional: When searching drug names, specify generic, brand, or both",
        enum: ["generic", "brand", "both"],
      },
    },
    required: ["search_term"],
  },
};

export async function fetchMedicalSearchResults(query: string) {
  try {
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const cx = process.env.REACT_APP_SEARCH_ENGINE_ID;
    
    const params = new URLSearchParams({
      key: apiKey!,
      cx: cx!,
      q: query,
      num: "5",
      safe: "active",
      gl: "us",
    });
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching medical search results:", error);
    return [];
  }
}

export function formatResultsForPrompt(results: any[]): string {
  if (!results || results.length === 0) {
    return "No relevant medical information found.";
  }
  
  let formatted = "\nRelevant medical information:\n";
  
  results.forEach((result, i) => {
    formatted += `\n[${i + 1}] ${result.title}`;
    formatted += `\nSource: ${result.displayLink}`;
    formatted += `\nSummary: ${result.snippet}`;
    formatted += `\nURL: ${result.link}\n`;
  });
  
  return formatted;
}

export async function queryDailyMedApi(params: Record<string, any>) {
  const baseUrl = "https://dailymed.nlm.nih.gov/dailymed/services/v2";
  const endpoint = params.setid ? `spls/${params.setid}` : "drugnames";
  
  try {
    const response = await fetch(`${baseUrl}/${endpoint}.json`);
    
    if (!response.ok) {
      throw new Error(`DailyMed request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error querying DailyMed API:", error);
    return { error: `Failed to fetch drug information: ${error}` };
  }
}

export function formatDailyMedResults(data: any): string {
  if (!data || data.error) {
    return `No drug information found. Error: ${data?.error || 'Unknown error'}`;
  }
  
  let formatted = "\nDrug Information from DailyMed (NIH):\n";
  
  if (data.data && Array.isArray(data.data)) {
    data.data.forEach((item: any, i: number) => {
      formatted += `\n[${i + 1}] ${item.drug_name || item.name}`;
      if (item.setid) formatted += `\n   SetID: ${item.setid}`;
      if (item.manufacturer) formatted += `\n   Manufacturer: ${item.manufacturer}`;
    });
  }
  
  return formatted;
}