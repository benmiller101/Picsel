/* ---- contact.js — sending the enquiry without leaving the page ------------
   Progressive enhancement, and nothing more. The form in the markup is a
   complete, working HTML form: a real action, a real method, native required
   validation. If this file never loads, is blocked, or throws, the form still
   posts the ordinary way and the visitor lands on /contact/sent/.

   What this adds is that the answer arrives in place. Someone who has just
   typed out what their business does should not have the page they were reading
   swapped for a different one — they should see a line appear under the button
   saying it went. That is the whole feature. */

const form = document.getElementById('enquiry-form');
const status = document.getElementById('enquiry-status');

/* Both or neither. If the markup ever changes underneath this file, doing
   nothing leaves a form that still works rather than one that half works. */
if (form && status) {
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button ? button.textContent : '';

  form.addEventListener('submit', async (event) => {
    /* Let the browser have first refusal. checkValidity() reports whether the
       required fields are filled and the email looks like one; when it fails we
       do not preventDefault, so the browser shows its own message on the
       offending field. Those messages are translated into the visitor's
       language and announced by screen readers, which a hand-rolled set of
       error strings would not be. */
    if (!form.checkValidity()) return;

    event.preventDefault();

    setStatus('', null);
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }

    try {
      const data = new FormData(form);

      /* The redirect field is for the no-JavaScript path only. Left in, the API
         answers this background request with a redirect instead of the JSON
         result we need to know whether it worked. */
      data.delete('redirect');

      const response = await fetch(form.action, {
        method: 'POST',
        /* Asks for the JSON answer rather than a redirect or an HTML page. */
        headers: { Accept: 'application/json' },
        body: data,
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        form.reset();
        setStatus('Thanks — that’s arrived. We’ll come back to you.', 'ok');
      } else {
        /* Deliberately not showing the API's own message. It is written for a
           developer ("Access key is invalid"), and it is not the visitor's
           problem to solve — a working phone number is. */
        setStatus(failureMessage(), 'error');
      }
    } catch {
      /* Offline, DNS, a blocked request. Same answer: the enquiry did not go,
         here is another way to reach us. */
      setStatus(failureMessage(), 'error');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    }
  });

  /* The failure text is built from the number already in the markup rather than
     written out here, so this file cannot end up quoting an old phone number
     after site.config.js is changed. */
  function failureMessage() {
    const phoneLink = document.querySelector('.contact-direct__phone');
    const phone = phoneLink ? phoneLink.textContent.trim() : '';

    return phone
      ? `That didn’t send. Ring us on ${phone} or email us instead — we’d rather not lose it.`
      : 'That didn’t send. Ring or email us instead — we’d rather not lose it.';
  }

  function setStatus(message, kind) {
    status.textContent = message;
    status.classList.toggle('is-ok', kind === 'ok');
    status.classList.toggle('is-error', kind === 'error');

    /* role="status" announces the message on its own, but resetting the form
       drops keyboard focus back to the top of the document — so someone who has
       just tabbed to the button and pressed it would be left with no idea where
       they are. Moving focus to the result puts them on the answer. */
    if (message) status.focus();
  }
}
