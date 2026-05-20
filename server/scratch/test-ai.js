async function test() {
  console.log("Sending test POST to localhost:5002/api/ai-recognize...");
  try {
    const payload = {
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png"
    };

    const res = await fetch("http://localhost:5002/api/ai-recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch failed:", error.message);
  }
}

test().catch(console.error);
