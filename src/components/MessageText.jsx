import React from "react";

const URL_REGEX =
  /((https?:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

const isUrl = (text) => {
  return /^(https?:\/\/|www\.|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/i.test(
    text
  );
};

const cleanUrl = (url) => {
  const trailingPunctuation = /[.,!?;:)\]}]+$/;

  let clean = url;
  let punctuation = "";

  while (trailingPunctuation.test(clean)) {
    punctuation = clean.slice(-1) + punctuation;
    clean = clean.slice(0, -1);
  }

  return {
    clean,
    punctuation,
  };
};

const MessageText = ({ text }) => {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (!part) return null;

        if (isUrl(part)) {
          const { clean, punctuation } = cleanUrl(part);

          let href = clean;

          if (clean.startsWith("www.")) {
            href = `https://${clean}`;
          } else if (!/^https?:\/\//i.test(clean)) {
            href = `https://${clean}`;
          }

          return (
            <React.Fragment key={index}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {clean}
              </a>

              {punctuation && <span>{punctuation}</span>}
            </React.Fragment>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default MessageText;
