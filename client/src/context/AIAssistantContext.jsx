import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { aiService } from "@/services";
import { getErrorMessage } from "@/services/api";

const AIAssistantContext = createContext(undefined);

export const AIAssistantProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProductState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [compareProductId, setCompareProductId] = useState("");
  const messageId = useRef(0);
  const lastRequest = useRef(null);

  const { mutate, isPending, reset } = useMutation({
    mutationFn: (payload) => aiService.productChat(payload),
    onSuccess: ({ answer }) => {
      setMessages((previous) => [
        ...previous,
        { id: `ai-${++messageId.current}`, role: "assistant", content: answer },
      ]);
      setError("");
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  useEffect(() => {
    setMessages([]);
    setError("");
    setCompareProductId("");
    lastRequest.current = null;
    reset();
  }, [product?.id, reset]);

  const setProduct = useCallback((next) => {
    const id = next?.id || next?._id || "";
    if (!id) {
      setProductState(null);
      return;
    }
    const name = next.name || "";
    const relatedProducts = next.relatedProducts || [];
    setProductState((previous) =>
      previous?.id === id && previous.name === name
        ? previous
        : { id, name, relatedProducts },
    );
  }, []);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((value) => !value), []);

  const clearChat = useCallback(() => {
    lastRequest.current = null;
    setMessages([]);
    setError("");
    reset();
  }, [reset]);

  const sendMessage = useCallback(
    (value) => {
      const content = String(value ?? "").trim();
      if (!content || !product?.id || isPending) return;

      const payload = {
        productId: product.id,
        message: content,
        conversationHistory: messages.slice(-10).map(({ role, content: body }) => ({
          role,
          content: body,
        })),
        ...(compareProductId ? { compareProductId } : {}),
      };
      lastRequest.current = payload;
      setError("");
      setMessages((previous) => [
        ...previous,
        { id: `user-${++messageId.current}`, role: "user", content },
      ]);
      mutate(payload);
    },
    [product?.id, compareProductId, messages, isPending, mutate],
  );

  const retry = useCallback(() => {
    if (!lastRequest.current || isPending) return;
    setError("");
    mutate(lastRequest.current);
  }, [isPending, mutate]);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        product,
        setProduct,
        messages,
        isLoading: isPending,
        error,
        compareProductId,
        setCompareProductId,
        sendMessage,
        clearChat,
        retry,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used inside AIAssistantProvider");
  }
  return context;
};
