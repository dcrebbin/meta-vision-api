import { Layout } from "@/components/layout/layout";
import { providerToTitle } from "@/lib/constants";
import { Log, Message, onMessage } from "@/lib/messaging";
import { StorageKey, useStorage } from "@/lib/storage";
import { useApiKeyStore } from "@/lib/store/api-key.store";
import { ListCollapse, SettingsIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Provider, TTSProvider } from "~/types";

const Popup = () => {
  const [activeTab, setActiveTab] = useState("logs");
  function popOut() {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 800,
      height: 600,
    });
    window.close();
  }

  const isWindowedPopup = window.outerWidth > 400 && window.outerHeight > 400;

  return (
    <Layout>
      <div
        className={`w-screen max-h-screen flex flex-col items-center justify-baseline text-white font-sans p-4 ${
          isWindowedPopup ? "h-full" : "h-96"
        }`}
      >
        <div className="flex flex-row w-full justify-between gap-2.5 px-8 py-2">
          <button
            className={`text-sm flex items-center gap-2 cursor-pointer ${
              activeTab === "logs" ? "text-white" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("logs")}
          >
            Logs
            <ListCollapse className="w-4 h-4" />
          </button>
          <button
            className={`text-sm flex items-center gap-2 cursor-pointer ${
              activeTab === "settings" ? "text-white" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            API Keys
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        {activeTab === "logs" && <Logs />}
        {activeTab === "settings" && <Settings />}

        {!isWindowedPopup && (
          <button
            className="absolute bottom-0 m-2 right-0 w-fit p-2 bg-[#4a4a4a] border-none rounded text-white cursor-pointer hover:bg-[#5a5a5a]"
            onClick={popOut}
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </button>
        )}
      </div>
    </Layout>
  );
};

const Logs = () => {
  const storage = useStorage(StorageKey.LOGS);
  const [receivedLogs, setReceivedLogs] = useState<Log[]>([]);
  useEffect(() => {
    const parsedLogs = Log.fromJSON(JSON.stringify(storage.data));

    console.log(parsedLogs);
    try {
      setReceivedLogs(parsedLogs);
    } catch (error) {
      console.error(error);
    }
    const unsubscribe = onMessage(
      Message.RECEIVE_LOG,
      (message: { data: Log }) => {
        const currentLogs = storage.data ?? [];
        storage.set([...currentLogs, message.data]);
        setReceivedLogs((prev) => [...prev, message.data]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [storage.data]);

  return (
    <div
      className="flex flex-col gap-3 w-full h-full overflow-y-auto mb-6"
      id="logs-container"
    >
      <button
        className="w-fit fixed bottom-0 left-0 m-2 p-2 bg-[#4a4a4a] border-none rounded text-white cursor-pointer hover:bg-[#5a5a5a]"
        onClick={() => {
          storage.set([]);
          setReceivedLogs([]);
        }}
      >
        Clear Logs
      </button>
      <div id="logs-container">
        {receivedLogs?.map((log, index) => (
          <div
            key={index}
            className="text-sm flex flex-col items-start justify-between w-full my-4"
          >
            <hr className="w-full border-gray-400" />
            <p className="text-xs text-gray-400 font-mono">
              {new Date(log.timestamp).toLocaleString()}
            </p>
            <p>{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProviderSetting = ({ provider }: { provider: string }) => {
  const apiKeysStore = useApiKeyStore();
  const apiKey = apiKeysStore.apiKeys[provider as Provider | TTSProvider];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <label className="text-xs font-bold text-white" htmlFor={provider}>
        {providerToTitle[provider as keyof typeof providerToTitle]}
      </label>
      <input
        className="w-full p-2 bg-[#4a4a4a] border-none rounded text-white cursor-pointer hover:bg-[#5a5a5a]"
        type="password"
        id={provider}
        value={apiKey}
        onChange={(e) => {
          apiKeysStore.setApiKeys({ [provider]: e.target.value });
        }}
      />
    </div>
  );
};

const Settings = () => {
  return (
    <div className="flex flex-col gap-3 w-full h-screen overflow-y-auto mb-6 px-2 pb-2">
      {Object.keys(providerToTitle).map((provider) => (
        <div key={provider}>
          <ProviderSetting provider={provider} />
        </div>
      ))}
      <p className="text-center">Is your provider of choice not here?</p>
      <div className="flex flex-row items-center justify-center gap-2">
        <a
          className="flex items-center justify-center gap-2 h-10 rounded-full drop-shadow-2xl cursor-pointer hover:underline"
          aria-label="View on GitHub"
          href="https://github.com/dcrebbin/meta-vision-api"
          target="_blank"
        >
          <p className="text-center text-base font-bold ">Submit a PR!</p>
          <span className="flex items-center justify-center">
            <svg
              width="34"
              height="34"
              viewBox="0 0 98 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                fill="#fff"
              />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
