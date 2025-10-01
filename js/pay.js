document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Ma'lumotlarni olish
    const storedData = localStorage.getItem("formData");
    if (!storedData) return;

    const data = JSON.parse(storedData);
    if (!data.timestamp) return;

    const date = new Date(data.timestamp);

    // Format: oy.kun.yil soat:minut
    const formattedDate = `${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(
      2,
      "0"
    )}.${date.getFullYear()} ${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;

    const formData = new FormData();

    formData.append("Ism", data.name);
    formData.append("Telefon raqam", data.phone_number);
    formData.append("Tarif", data.type);
    formData.append("Sana", formattedDate);
    formData.append("sheetName", "SignUp");

    // Yuborish
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbyiuypfPnPzjveL9DhTLRRAD23LN2OaFOTu6Fp-xKcLv-bTGodTRFJeqTw-FyeVrtsSBA/exec",
      {
        method: "POST",
        body: formData,
      }
    );

    // Yuborilgan deb belgilash
    if (response.ok) {
      localStorage.setItem("formDataSent", "true");
      console.log("Ma'lumot yuborildi va flag o‘rnatildi.");
    } else {
      console.error("Yuborishda xatolik:", response.statusText);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Tarmoq xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.");
  }
});


const localData = JSON.parse(localStorage.getItem("formData") || "{}");
const payment__tariff = document.querySelector(".payment__tariff");
const payment__price = document.querySelectorAll(".pricesAll");
const payment__price2 = document.querySelector(".payment__card-amount");

payment__tariff.innerHTML = `
    Tarif: ${localData.type || "VIP"}
`;

// Har bir .pricesAll elementiga qiymat qo'yish
payment__price.forEach((priceElement) => {
  if (localData.type === "standart") {
    priceElement.innerHTML = "2 000 000 so'm";
  } else if (localData.type === "premium") {
    priceElement.innerHTML = "2 300 000 so'm";
  } else {
    priceElement.innerHTML = "5 000 000 so'm";
  }
});

// if (payment__price2) {
//   if (localData.type === "standart") {
//     priceElement.innerHTML = "897 000 so'm";
//   } else if (localData.type === "premium") {
//     priceElement.innerHTML = "997 000 so'm";
//   } else {
//     priceElement.innerHTML = "1 970 000 so'm";
//   }
// }

const priceVisa = document.querySelector(".priceVisa");

// Valyuta kursini olish uchun API so'rovi
async function convertUZStoUSD(amountUZS) {
  try {
    const response = await fetch(
      "https://v6.exchangerate-api.com/v6/7fc5c84f9bccd12c6b0dc440/latest/UZS"
    );
    const data = await response.json();
    const rate = data.conversion_rates.USD; // 1 UZS = ? USD (masalan, 0.00007872)
    const amountUSD = (amountUZS * rate).toFixed(2); // So‘mni USD ga aylantirish
    return amountUSD;
  } catch (error) {
    console.error("Valyuta kursini olishda xatolik:", error);
    return null;
  }
}

// Narxni yangilash
async function updatePriceVisa() {
  let priceUZS;

  if (localData.type === "standart") {
    priceUZS = 2000000;
  } else if (localData.type === "premium") {
    priceUZS = 2300000;
  } else {
    priceUZS = 5000000;
  }

  const priceUSD = await convertUZStoUSD(priceUZS);
  if (priceUSD) {
    priceVisa.innerHTML = `${priceUSD} USD`;
  } else {
    priceVisa.innerHTML = "Valyuta kursini olishda xatolik";
  }
}

// Funksiyani chaqirish
updatePriceVisa();

document
  .getElementById("paymentForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission (page refresh)

    const submitButton = this.querySelector(".payment__btn");
    submitButton.disabled = true;
    submitButton.textContent = "Yuborilmoqda...";

    try {
      // Get existing localStorage data
      const localData = JSON.parse(localStorage.getItem("formData") || "{}");

      // Validate localData
      if (!localData.name || !localData.phone_number) {
        alert(
          "Ism yoki telefon raqami topilmadi. Iltimos, formani to‘ldiring."
        );
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      // Get form data
      const formData = new FormData(this);
      const paymentType = formData.get("status");
      const file = formData.get("chek");

      if (!file || file.size === 0) {
        alert("Chek rasmini yuklang");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("Fayl hajmi 10MB dan kichik bo‘lishi kerak");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      // Check file type
      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        alert("Faqat PNG, JPG yoki PDF fayllarni yuklash mumkin");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      // Prepare data to save in localStorage
      const updatedLocalData = {
        ...localData,
        payment_type: paymentType.toString(),
        file_name: file.name,
        last_submitted: new Date().toISOString(),
      };

      // Save updated data to localStorage
      localStorage.setItem("formData", JSON.stringify(updatedLocalData));

      // Create new FormData object for API
      const apiFormData = new FormData();
      apiFormData.append("name", localData.name.toString());
      apiFormData.append("phone_number", localData.phone_number.toString());
      apiFormData.append("payment_type", paymentType); // Fixed: Use paymentType instead of localData.type
      apiFormData.append("picture", file);
      apiFormData.append("tarif", localData.type.toString());
      apiFormData.append("status", paymentForm.status.value);


      // Send to API
      const response = await fetch("https://jenskaya-alximiya.asosit.uz/api/dataflow2", {
        method: "POST",
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(
          `Server responded with ${response.status}: ${JSON.stringify(
            errorData
          )}`
        );
      }

      // Reset form and UI
      this.reset();
      document.querySelector(".uploadCheck").innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="inline transform -translate-y-[2px]"
        >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      submitButton.disabled = false;
      submitButton.textContent = "Davom etish";

      // Redirect to thank you page
      window.location.href = "/thankYou.html";
    } catch (error) {
      console.error("Error:", error.message || error);
      alert(
        `Xato yuz berdi: ${error.message}. Iltimos, keyinroq qayta urinib ko‘ring.`
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Davom etish";
    }
  });
// Display file name and validate when a file is selected
document.getElementById("chek").addEventListener("change", function () {
  const file = this.files[0];
  const uploadLabel = document.querySelector(".uploadCheck");

  if (file) {
    // Check file size
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Fayl hajmi 10MB dan kichik bo‘lishi kerak");
      this.value = ""; // Clear the input
      uploadLabel.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="inline transform -translate-y-[2px]"
        >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      return;
    }

    // Check file type
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Faqat PNG, JPG yoki PDF fayllarni yuklash mumkin");
      this.value = ""; // Clear the input
      uploadLabel.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="inline transform -translate-y-[2px]"
        >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      return;
    }

    uploadLabel.innerHTML = `
      <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="inline transform -translate-y-[2px]"
      >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
      </svg>
      ${file.name}
    `;
  } else {
    uploadLabel.innerHTML = `
      <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="inline transform -translate-y-[2px]"
      >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
      </svg>
      Chek rasmini yuklash uchun bu yerga bosing
    `;
  }
});

document.querySelectorAll(".copy").forEach((btn) => {
  // Store the original SVG
  const originalSVG = btn.innerHTML;

  // Define the tick SVG
  const tickSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2F80EC" class="size-8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  `;

  btn.addEventListener("click", () => {
    // Find the card number from the closest .payment__card element
    const cardNumber = btn
      .closest(".payment__card")
      .querySelector(".payment__card-number")
      .textContent.trim();

    // Copy to clipboard
    navigator.clipboard
      .writeText(cardNumber)
      .then(() => {
        // Show success message

        // Change to tick SVG
        btn.innerHTML = tickSVG;

        // Revert to original SVG after 1.5 seconds
        setTimeout(() => {
          btn.innerHTML = originalSVG;
        }, 1500);
      })
      .catch((err) => {
        // Show error message
        alert("Nusxalashda xatolik yuz berdi!");
        console.error(err);
      });
  });
});

let timerElement = document.getElementById("timer");
let time = timerElement.innerText.split(":");
let minutes = parseInt(time[0], 10);
let seconds = parseInt(time[1], 10);

function updateTimer() {
  if (seconds === 0) {
    if (minutes === 0) {
      clearInterval(timerInterval);
      timerElement.innerText = "00:00";
      // Bu yerga tugaganidan keyin nima bo'lishi kerakligini yoz
      return;
    }
    minutes--;
    seconds = 59;
  } else {
    seconds--;
  }

  let minStr = minutes < 10 ? "0" + minutes : minutes;
  let secStr = seconds < 10 ? "0" + seconds : seconds;
  timerElement.innerText = `${minStr}:${secStr}`;
}

let timerInterval = setInterval(updateTimer, 1000);
