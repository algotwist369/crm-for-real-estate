require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { createAuthTokenFromUser } = require('./utils/generateToken');

async function testUpload() {
    try {
        const token = createAuthTokenFromUser({ _id: "69c27287a6d1e2adb3e69a3f", role: "admin", email: "test@test.com" });

        const propertyId = "69c28942c3a9a1f33c19803d"; 
        
        const payload = {
            property_title: "Luxury 2BHK Apartment in Downtown Dubai",
            listing_type: "rent",
            documents: [
                { name: "Test URL Document", value: "https://example.com/test.pdf" }
            ],
            documents_base64: [
                { name: "Test Base64 Document", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8gV29ybGQ=" }
            ]
        };

        const res = await fetch(`http://localhost:5001/api/properties/${propertyId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Status:", res.status);
        if (data.data && data.data.documents) {
            console.log("Documents in Response:");
            console.log(JSON.stringify(data.data.documents, null, 2));
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

testUpload();
