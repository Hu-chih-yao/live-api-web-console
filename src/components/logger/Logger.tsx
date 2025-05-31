/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./logger.scss";
import { Part } from "@google/genai";
import classNames from "classnames";
import { ReactNode } from "react";
import { useLoggerStore } from "../../lib/store-logger";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  ClientContentMessage,
  isClientContentMessage,
  isModelTurn,
  isServerContentMessage,
  isToolCallMessage,
  isToolResponseMessage,
  ServerContentMessage,
  StreamingLog,
  ToolCallMessage,
  ToolResponseMessage
} from "../../multimodal-live-types";

const formatTime = (d: Date) => d.toLocaleTimeString().slice(0, -3);

const LogEntry = memo(
  ({
    log,
    MessageComponent,
  }: {
    log: StreamingLog;
    MessageComponent: ({
      message,
    }: {
      message: StreamingLog["message"];
    }) => ReactNode;
  }): JSX.Element => (
    <li
      className={classNames(
        `plain-log`,
        `source-${log.type.slice(0, log.type.indexOf("."))}`,
        {
          receive: log.type.includes("receive"),
          send: log.type.includes("send"),
        }
      )}
    >
      <span className="timestamp">{formatTime(log.date)}</span>
      <span className="source">{log.type}</span>
      <span className="message">
        <MessageComponent message={log.message} />
      </span>
      {log.count && <span className="count">{log.count}</span>}
    </li>
  )
);

const PlainTextMessage = ({
  message,
}: {
  message: StreamingLog["message"];
}) => <span>{message as string}</span>;

type Message = { message: StreamingLog["message"] };

const AnyMessage = ({ message }: Message) => (
  <pre>{JSON.stringify(message, null, "  ")}</pre>
);

function tryParseCodeExecutionResult(output: string) {
  try {
    const json = JSON.parse(output);
    return JSON.stringify(json, null, "  ");
  } catch (e) {
    return output;
  }
}

const RenderPart = memo(({ part }: { part: Part }) => {
  if (part.text && part.text.length) {
    return <p className="part part-text">{part.text}</p>;
  }
  if (part.executableCode) {
    return (
      <div className="part part-executableCode">
        <h5>executableCode: {part.executableCode.language}</h5>
        <SyntaxHighlighter
          language={part.executableCode!.language!.toLowerCase()}
          style={dark}
        >
          {part.executableCode!.code!}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (part.codeExecutionResult) {
    return (
      <div className="part part-codeExecutionResult">
        <h5>codeExecutionResult: {part.codeExecutionResult!.outcome}</h5>
        <SyntaxHighlighter language="json" style={dark}>
          {tryParseCodeExecutionResult(part.codeExecutionResult!.output!)}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (part.inlineData) {
    return (
      <div className="part part-inlinedata">
        <h5>Inline Data: {part.inlineData?.mimeType}</h5>
      </div>
    );
  }
  return <div className="part part-unknown">&nbsp;</div>;
});

const ClientContentLog = memo(({ message }: Message) => {
  const clientContent = message as ClientContentMessage;
  const textParts = clientContent.turns.filter((part) => !(part.text && part.text === "\n"));
  return (
    <div className="rich-log client-content user">
      <h4 className="roler-user">User</h4>
      <div key={`message-turn`}>
        {textParts.map((part, j) => (
          <RenderPart part={part} key={`message-part-${j}`} />
        ))}
      </div>
      {!clientContent.turnComplete ? <span>turnComplete: false</span> : ""}
    </div>
  );
});

const ToolCallLog = memo(({ message }: Message) => {
  const toolCallMessage = message as ToolCallMessage;
  return (
    <div className={classNames("rich-log tool-call")}>
      {toolCallMessage.toolCall.functionCalls?.map((fc, i) => (
        <div key={fc.id} className="part part-functioncall">
          <h5>Function call: {fc.name}</h5>
          <SyntaxHighlighter language="json" style={dark}>
            {JSON.stringify(fc, null, "  ")}
          </SyntaxHighlighter>
        </div>
      ))}
    </div>
  );
});

const ToolCallCancellationLog = ({ message }: Message): JSX.Element => (
  <div className={classNames("rich-log tool-call-cancellation")}>
    <span>
      {" "}
      ids:{" "}
      {(message as any).toolCallCancellation.ids?.map((id: string) => (
        <span className="inline-code\" key={`cancel-${id}`}>
          "{id}"
        </span>
      ))}
    </span>
  </div>
);

const ToolResponseLog = memo(
  ({ message }: Message): JSX.Element => {
    const toolResponse = message as ToolResponseMessage;
    return (
      <div className={classNames("rich-log tool-response")}>
        {toolResponse.functionResponses?.map((fc) => (
          <div key={`tool-response-${fc.id}`} className="part">
            <h5>Function Response: {fc.id}</h5>
            <SyntaxHighlighter language="json" style={dark}>
              {JSON.stringify(fc.response, null, "  ")}
            </SyntaxHighlighter>
          </div>
        ))}
      </div>
    );
  }
);

const ModelTurnLog = ({ message }: Message): JSX.Element => {
  const serverContent = message as ServerContentMessage;
  const parts = serverContent.serverContent.modelTurn?.parts || [];

  return (
    <div className="rich-log model-turn model">
      <h4 className="role-model">Model</h4>
      {parts
        .filter((part) => !(part.text && part.text === "\n"))
        .map((part, j) => (
          <RenderPart part={part} key={`model-turn-part-${j}`} />
        ))}
    </div>
  );
};

const CustomPlainTextLog = (msg: string) => () =>
  <PlainTextMessage message={msg} />;

export type LoggerFilterType = "conversations" | "tools" | "none";

export type LoggerProps = {
  filter: LoggerFilterType;
};

const filters: Record<LoggerFilterType, (log: StreamingLog) => boolean> = {
  tools: (log: StreamingLog) =>
    isToolCallMessage(log.message) ||
    isToolResponseMessage(log.message),
  conversations: (log: StreamingLog) =>
    isClientContentMessage(log.message) ||
    isServerContentMessage(log.message),
  none: () => true,
};

const component = (log: StreamingLog) => {
  if (typeof log.message === "string") {
    return PlainTextMessage;
  }
  if (isClientContentMessage(log.message)) {
    return ClientContentLog;
  }
  if (isToolCallMessage(log.message)) {
    return ToolCallLog;
  }
  if ("toolCallCancellation" in log.message) {
    return ToolCallCancellationLog;
  }
  if (isToolResponseMessage(log.message)) {
    return ToolResponseLog;
  }
  if (isServerContentMessage(log.message)) {
    const { serverContent } = log.message;
    if (serverContent?.interrupted) {
      return CustomPlainTextLog("interrupted");
    }
    if (serverContent?.turnComplete) {
      return CustomPlainTextLog("turnComplete");
    }
    if (isModelTurn(serverContent)) {
      return ModelTurnLog;
    }
  }
  return AnyMessage;
};

export default function Logger({ filter = "none" }: LoggerProps) {
  const { logs } = useLoggerStore();

  const filterFn = filters[filter];

  return (
    <div className="logger">
      <ul className="logger-list">
        {logs.filter(filterFn).map((log, key) => {
          return (
            <LogEntry MessageComponent={component(log)} log={log} key={key} />
          );
        })}
      </ul>
    </div>
  );
}