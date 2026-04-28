export function initContactForm(ui) {
  const { contactForm, formSuccess } = ui;

  if (!contactForm || !formSuccess) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const submitBtn = contactForm.querySelector(".btn-submit");
    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Sending...";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: contactForm.fullName.value.trim(),
          email: contactForm.email.value.trim(),
          subject: contactForm.subject.value.trim(),
          message: contactForm.message.value.trim(),
          website: contactForm.website?.value ?? "",
        }),
      });

      if (!res.ok) throw new Error("Send failed");

      contactForm.hidden = true;
      formSuccess.classList.remove("hidden");
      contactForm.reset();

    } catch (err) {
      submitBtn.querySelector("span").textContent = "Something went wrong — try again";
      submitBtn.disabled = false;
    }
  });
}
