from langchain_google_genai import ChatGoogleGenerativeAI
print("Import successful!")
try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", vertexai=True, credentials=None)
    print("Initialization (partial) successful!")
except Exception as e:
    # Expected to fail due to missing credentials, but import should work
    print(f"Initialization attempt: {e}")
