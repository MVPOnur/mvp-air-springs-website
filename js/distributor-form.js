// "Become a distributor" form: validation on blur, error summary on submit,
// then POST to MVP_CONFIG.formEndpoint, or open an email if none is set.
(function () {
  "use strict";
  const cfg = window.MVP_CONFIG;

  function messageFor(input) {
    if (input.validity.valid) return "";
    if (input.validity.valueMissing) return input.dataset.msg;
    return input.dataset.msg || "Check this field";
  }

  function showError(input, msg) {
    const err = document.getElementById(input.id + "-error");
    if (!err) return;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg;
    err.classList.toggle("show", !!msg);
  }

  function summaryText(form) {
    const data = new FormData(form);
    const lines = [];
    for (const el of form.querySelectorAll("input:not(#fax), select, textarea")) {
      const label = form.querySelector(`label[for="${el.id}"]`);
      const value = (data.get(el.name) || "").toString().trim();
      if (value) lines.push(`${label ? label.childNodes[0].textContent.trim() : "Part number"}: ${value}`);
    }
    return lines.join("\n");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-distributor-form]");
    if (!form) return;
    const summary = form.querySelector("[data-error-summary]");
    const submit = form.querySelector("[data-submit]");
    const success = document.querySelector("[data-success]");
    const fields = [...form.querySelectorAll("input[data-msg], select[data-msg]")];

    // Part number handed over from a product page or a failed search: sent
    // with the application in a hidden field, and shown above the button.
    const part = new URLSearchParams(location.search).get("part");
    if (part) {
      form.elements.parts.value = part;
      form.querySelector("[data-part-label]").textContent = part;
      form.querySelector("[data-part-note]").hidden = false;
    }

    for (const f of fields) {
      f.addEventListener("blur", () => { if (f.value || f.getAttribute("aria-invalid") === "true") showError(f, messageFor(f)); });
      f.addEventListener("input", () => { if (f.getAttribute("aria-invalid") === "true") showError(f, messageFor(f)); });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = fields.filter((f) => !f.validity.valid);
      fields.forEach((f) => showError(f, messageFor(f)));
      if (invalid.length) {
        summary.querySelector("ul").innerHTML = invalid
          .map((f) => `<li><a href="#${f.id}">${messageFor(f)}</a></li>`).join("");
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;
      if (form.elements._gotcha.value) return; // spam bot filled the hidden field

      const done = (viaEmail) => {
        if (viaEmail) {
          success.querySelector("h2").textContent = "Almost done — check your email app";
          success.querySelector("p").textContent = "Your email app should have opened with the application filled in. Press Send there to finish. If nothing opened, email us the same details.";
        }
        form.hidden = true;
        success.hidden = false;
        success.focus();
      };

      const subject = `Distributor application — ${form.elements.company.value.trim()}`;
      if (!cfg.formEndpoint) {
        const to = /\[/.test(cfg.email) ? "" : cfg.email;
        location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText(form))}`;
        done(true);
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending…";
      try {
        const data = new FormData(form);
        let req;
        if (/formsubmit\.co/.test(cfg.formEndpoint)) {
          // FormSubmit (no account): JSON body, _honey is its honeypot, _template "table"
          // lays the answers out as a table in the email.
          const fields = Object.fromEntries(data);
          fields._honey = fields._gotcha;
          delete fields._gotcha;
          Object.assign(fields, { _subject: subject, _template: "table", _captcha: "false", _replyto: fields.email });
          req = { headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(fields) };
        } else {
          // Formspree-style: _subject sets the subject, _gotcha is the honeypot.
          data.set("_subject", subject);
          req = { headers: { Accept: "application/json" }, body: data };
        }
        const res = await fetch(cfg.formEndpoint, { method: "POST", ...req });
        const reply = await res.json().catch(() => ({}));
        if (!res.ok || reply.success === false || reply.success === "false") throw new Error(reply.message || res.status);
        done();
      } catch (err) {
        console.error(err);
        submit.disabled = false;
        submit.textContent = "Send application";
        summary.querySelector("h2").textContent = "Your application wasn’t sent";
        const mail = /\[/.test(cfg.email) ? "us" : `<a href="mailto:${cfg.email}">${cfg.email}</a>`;
        summary.querySelector("ul").innerHTML = `<li>Please try again in a moment, or email ${mail} directly.</li>`;
        summary.hidden = false;
        summary.focus();
      }
    });
  });
})();
