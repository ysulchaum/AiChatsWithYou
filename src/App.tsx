import "./App.css";
import { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { useConversationStore } from "./store/conversationStore.tsx"; // Import the store

export interface Message {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  audioUrl?: string;
}

interface UserInfo {
  user_id: number;
  user_name: string;
  email: string;
  token: number | null;
  pro_member: boolean;
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [status, setStatus] = useState("Press the microphone to start");
  const [textInput, setTextInput] = useState("");
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const {
    conversation,
    image,
    isImageLoading,
    setConversation,
    addMessage,
    clearConversation,
    setImage,
    setIsImageLoading,
  } = useConversationStore();

  // Get user info from local storage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Scroll to the bottom of the conversation
  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop =
        conversationContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Fetch history and image on mount only if conversation or image is empty
  useEffect(() => {
    const abortController = new AbortController();
    if (conversation.length === 0) {
      getHistory(abortController.signal);
    } else if (!image) {
      handleImage(abortController.signal);
    }
    return () => {
      abortController.abort();
    };
  }, [conversation.length, image]);

  // Fetch user data on mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:5000/get-user-info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Google-Sub": user?.sub || "",
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setUserInfo(data.user);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Error fetching user data:", error);
      setStatus("Error loading user data");
    }
  };

  const checkLogin = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "X-Google-Sub": user?.sub || "",
  });

  const handleNSFWToggle = async (isNSFW: boolean) => {
    if (!checkLogin()) return;

    try {
      const response = await fetch("http://localhost:5000/is-NSFW", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isNSFW }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setStatus(data.message);
    } catch (error) {
      console.error("Error setting NSFW mode:", error);
      setStatus(
        `Error setting NSFW mode: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleNotEnoughToken = (): boolean => {
    if (!checkLogin()) return false;

    if (!userInfo) {
      setStatus("Error: User info not loaded yet");
      return false;
    }

    if (userInfo.token !== null && userInfo.token <= 0) {
      setStatus("Insufficient tokens. Redirecting to subscription...");
      handleSubscription();
      return false;
    }

    return true;
  };

  const handleSendText = async () => {
    if (!checkLogin()) return;

    if (!handleNotEnoughToken()) return; // Stop if insufficient tokens

    if (!textInput.trim()) {
      setStatus("Error: Please enter some text");
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      speaker: "user",
      text: textInput,
    };
    addMessage(userMessage); // Use store to add message
    setTextInput("");
    setStatus("Processing text...");

    try {
      const response = await fetch("http://localhost:5000/process-input", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: textInput }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiAudioPromise = fetch(
        `http://localhost:5000/get-ai-audio/${data.filenameAI}`,
        { headers: getAuthHeaders() }
      ).then((res) => res.blob());
      const aiAudioBlob = await aiAudioPromise;
      const aiAudioUrl = URL.createObjectURL(aiAudioBlob);

      const aiMessage: Message = {
        id: uuidv4(),
        speaker: "assistant",
        text: data.response,
        audioUrl: aiAudioUrl,
      };
      addMessage(aiMessage); // Use store to add message
      setStatus("Text processed successfully");

      // Fetch updated user data to reflect token deduction
      await fetchUserData();

      handleImage();
    } catch (error) {
      console.error("Error processing text:", error);
      setStatus(
        `Error processing text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleImage = async (signal?: AbortSignal) => {
    setIsImageLoading(true); // Start loading
    try {
      const response = await fetch("http://localhost:5000/generate-image", {
        method: "GET",
        headers: getAuthHeaders(),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageUrl = await response.text();

      if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
        throw new Error("Invalid or empty image URL received");
      }

      try {
        setImage(imageUrl);
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } catch (imgError) {
        console.warn(
          "Direct URL loading failed, attempting to fetch image:",
          imgError
        );
        const imageResponse = await fetch(imageUrl, {
          method: "GET",
          mode: "cors",
          signal,
        });

        if (!imageResponse.ok) {
          throw new Error(
            `Failed to fetch image from URL: ${imageResponse.statusText}`
          );
        }

        const imageBlob = await imageResponse.blob();
        const blobUrl = URL.createObjectURL(imageBlob);
        setImage(blobUrl);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Image fetch aborted");
        return;
      }
      console.error("Error fetching image:", error);
      setStatus(
        `Error: Failed to load image - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsImageLoading(false); // Stop loading
    }
  };

  const handleClear = async () => {
    if (!checkLogin()) return;

    const userConfirmed = window.confirm("Are you sure you want to clear?");
    if (userConfirmed) {
      try {
        // Revoke all audio URLs to prevent memory leaks
        conversation.forEach((message) => {
          if (message.audioUrl) {
            URL.revokeObjectURL(message.audioUrl);
          }
        });

        await fetch("http://localhost:5000/delete-all-conversations", {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        clearConversation(); // Use store to clear conversation and image
        handleImage(); // Fetch new image after clearing
      } catch (error) {
        console.error("Error clearing content:", error);
        setStatus("Error: Content not cleared");
      }
    }
  };

  const handleLogout = () => {
    // Revoke all audio URLs on logout
    conversation.forEach((message) => {
      if (message.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    clearConversation(); // Clear conversation and image on logout
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDashboard = () => {
    if (!checkLogin()) return;
    navigate("/dashboard");
  };

  const handlePaymentRecord = () => {
    if (!checkLogin()) return;
    navigate("/payment-record");
  };

  const handleSubscription = () => {
    if (!checkLogin()) return;
    navigate("/subscription");
  };

  const getHistory = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("http://localhost:5000/get-history", {
        method: "GET",
        headers: getAuthHeaders(),
        signal,
      });
      if (signal?.aborted) {
        console.log("Fetch aborted");
        return;
      }
      const data = await response.json();

      const userTranscripts = data.transcript;
      const aiResponses = data.response;
      const userAudioFiles = data.filenameUser;
      const aiAudioFiles = data.filenameAI;
      const historyImages = data.imageURL;
      const count = aiResponses.length;

      const newConversation: Message[] = [];
      for (let i = 0; i < count; i++) {
        let userAudioUrl: string | undefined;
        let aiAudioUrl: string | undefined;

        if (userAudioFiles[i]) {
          const userAudio = await fetch(
            `http://localhost:5000/get-user-audio/${userAudioFiles[i]}`,
            { headers: getAuthHeaders(), signal }
          );
          userAudioUrl = URL.createObjectURL(await userAudio.blob());
        }
        if (aiAudioFiles[i]) {
          const aiAudio = await fetch(
            `http://localhost:5000/get-ai-audio/${aiAudioFiles[i]}`,
            { headers: getAuthHeaders(), signal }
          );
          aiAudioUrl = URL.createObjectURL(await aiAudio.blob());
        }

        newConversation.push({
          id: uuidv4(),
          speaker: "user",
          text: userTranscripts[i] || "",
          audioUrl: userAudioUrl,
        });
        newConversation.push({
          id: uuidv4(),
          speaker: "assistant",
          text: aiResponses[i] || "",
          audioUrl: aiAudioUrl,
        });
      }

      setConversation(newConversation); // Use store to set conversation

      // Handle history image loading
      setIsImageLoading(true); // Start loading for history image
      try {
        console.log("Image URL:", historyImages);
        setImage(historyImages);
        const img = new Image();
        img.src = historyImages;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } catch (imgError) {
        console.warn(
          "Direct URL loading failed, attempting to fetch image:",
          imgError
        );
        const imageResponse = await fetch(historyImages, {
          method: "GET",
          mode: "cors",
          signal,
        });

        if (!imageResponse.ok) {
          throw new Error(
            `Failed to fetch image from URL: ${imageResponse.statusText}`
          );
        }

        const imageBlob = await imageResponse.blob();
        const blobUrl = URL.createObjectURL(imageBlob);
        setImage(blobUrl);
      } finally {
        setIsImageLoading(false); // Stop loading
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      console.error("Error fetching history:", error);
      setStatus(
        `Error fetching history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const toggleRecording = async () => {
    if (!checkLogin()) return;

    if (!handleNotEnoughToken()) return; // Stop if insufficient tokens

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");

          setStatus("Processing audio...");
          try {
            const response = await fetch(
              "http://localhost:5000/process-input",
              {
                method: "POST",
                headers: {
                  "X-Google-Sub": user?.sub || "",
                },
                body: formData,
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Server error: ${response.status} - ${errorText}`
              );
            }

            const data = await response.json();

            const userMessage: Message = {
              id: uuidv4(),
              speaker: "user",
              text: data.transcript,
              audioUrl: data.filenameUser
                ? URL.createObjectURL(
                    await (
                      await fetch(
                        `http://localhost:5000/get-user-audio/${data.filenameUser}`,
                        { headers: getAuthHeaders() }
                      )
                    ).blob()
                  )
                : undefined,
            };
            addMessage(userMessage); // Use store to add message

            const aiAudioPromise = fetch(
              `http://localhost:5000/get-ai-audio/${data.filenameAI}`,
              { headers: getAuthHeaders() }
            ).then((res) => res.blob());
            const aiAudioBlob = await aiAudioPromise;
            const aiAudioUrl = URL.createObjectURL(aiAudioBlob);

            const aiMessage: Message = {
              id: uuidv4(),
              speaker: "assistant",
              text: data.response,
              audioUrl: aiAudioUrl,
            };
            addMessage(aiMessage); // Use store to add message

            setStatus("Processing complete");

            // Fetch updated user data to reflect token deduction
            await fetchUserData();

            handleImage();
          } catch (error) {
            console.error("Error processing audio:", error);
            setStatus(
              `Error processing audio: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          } finally {
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setStatus("Recording... Speak now");
      } catch (error) {
        console.error("Error starting recording:", error);
        setStatus("Error: Microphone access denied");
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="layout">
      {/* Menu button and leftsilde */}
      <div className="menu-container">
        <div className="menu-button">
          <a onClick={() => setIsShowMenu(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="currentColor"
              className="bi bi-list"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </a>
        </div>
        <nav>
          <ul className={`sidebar ${isShowMenu ? "active" : ""}`}>
            <li>
              <a className="close-menu" onClick={() => setIsShowMenu(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-x-lg"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </a>
            </li>
            <li>
              <a onClick={handleDashboard}>Dashboard</a>
            </li>
            <li>
              <a onClick={handleSubscription}>Subscription</a>
            </li>
            <li>
              <a onClick={handlePaymentRecord}>Payment Record</a>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="app-container">
        <div className="left-side">
          <div className="title-container">
            <h1 className="title">
              Voice Assistant {user ? `- Welcome, ${user.name}` : ""}
            </h1>
            {user && (
              <button className="clear-button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
          <div className="image-container">
            <img
              src={image || "./background.png"}
              alt="Image expired"
              className="assistant-image"
            />
          </div>
          <div className="control-container">
            <button className="clear-button" onClick={handleClear}>
              Clear
            </button>
            <button
              className={`mic-button ${isRecording ? "recording" : ""}`}
              onClick={toggleRecording}
              disabled={status === "Processing..."}
            >
              {isRecording ? (
                <FaMicrophoneSlash size={24} color="#fff" />
              ) : (
                <FaMicrophone size={24} color="#fff" />
              )}
            </button>
            <input
              type="checkbox"
              id="toggle"
              className="toggleCheckbox"
              onChange={(e) => {
                console.log(
                  `Toggle changed to: ${e.target.checked ? "NSFW" : "SFW"}`
                );
                handleNSFWToggle(e.target.checked);
              }}
            />
            <label htmlFor="toggle" className="toggleContainer">
              <div>SFW</div>
              <div>NSFW</div>
            </label>
          </div>
          <div className="status">
            <p>
              {status} | token: {userInfo?.token}
            </p>
            {isImageLoading && (
              <div className="loader-container">
                <div className="circle-loader"></div>
              </div>
            )}
          </div>
        </div>

        <div className="right-side">
          <div
            className="conversation-container"
            ref={conversationContainerRef}
          >
            {conversation.map((message: Message) => (
              <div
                key={message.id}
                className={`message ${
                  message.speaker === "user"
                    ? "user-message"
                    : "assistant-message"
                }`}
              >
                <strong>{message.speaker === "user" ? "You:" : "May:"}</strong>{" "}
                {message.text}
                {message.audioUrl && (
                  <div>
                    <audio
                      className="audio-player"
                      controls
                      src={message.audioUrl}
                      onPlay={() => setStatus("Playing audio...")}
                      onEnded={() => setStatus("Audio finished")}
                    />
                  </div>
                )}
              </div>
            ))}
            {status.includes("Processing") && (
              <div className="loading-text">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="typewriter-container">
            <textarea
              className="text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message here..."
            />
            <button className="send-button" onClick={handleSendText}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;