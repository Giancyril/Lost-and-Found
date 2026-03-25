async function test() {
  const cats = await fetch("https://lost-and-found-jqmn.onrender.com/api/item-categories").then(r => r.json());
  const categoryId = cats.data[0].id;
  
  const payload = {
    lostItemName: "Test Item with Image",
    description: "Testing API image upload",
    location: "Library",
    date: new Date().toISOString(),
    categoryId,
    reporterName: "Test",
    schoolEmail: "test@nbsc.edu.ph",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  };
  
  const res = await fetch("https://lost-and-found-jqmn.onrender.com/api/lostItem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log("FULL_ERROR_MESSAGE:", data.message);
}

test().catch(console.error);
