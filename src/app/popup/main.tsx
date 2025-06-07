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

  return (
    <Layout>
      <div className="w-full min-w-[350px] max-h-screen flex flex-col items-center justify-baseline max-w-[100vw] min-h-[300px] bg-[#1c1e21] text-white font-sans p-4">
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
        const currentLogs = storage.data ?? "[]";
        storage.set([...currentLogs, JSON.stringify(message.data)]);
        setReceivedLogs((prev) => [...prev, message.data]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [storage.data]);

  return (
    <div
      className="flex flex-col gap-3 w-full min-h-[70vh] overflow-y-auto"
      id="logs-container"
    >
      <button
        className="w-fit absolute bottom-0 left-0 m-2 p-2 bg-[#4a4a4a] border-none rounded text-white cursor-pointer hover:bg-[#5a5a5a]"
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
    <div className="flex flex-col gap-3 w-full h-full min-h-[70vh]">
      {Object.keys(providerToTitle).map((provider) => (
        <div key={provider}>
          <ProviderSetting provider={provider} />
        </div>
      ))}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
