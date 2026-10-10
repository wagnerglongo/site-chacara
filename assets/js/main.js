const WHATSAPP_NUMBER = "5517981134522";

/* -------------------------------------------------------------------------
   Galeria em tela cheia
   Usa <dialog> nativo: foco preso, Esc fecha, e o leitor de tela anuncia o modal.
   Navegação por setas do teclado, botões e swipe no celular.
   ------------------------------------------------------------------------- */
class Lightbox {
  constructor(dialog, triggers) {
    this.dialog = dialog;
    this.image = dialog.querySelector(".lightbox__image");
    this.caption = dialog.querySelector(".lightbox__caption");
    this.photos = [...triggers].map((button) => ({
      button,
      src: button.dataset.full,
      alt: button.querySelector("img").alt,
    }));
    this.index = 0;
    this.touchStartX = null;
    this.bind();
  }

  bind() {
    this.photos.forEach((photo, i) => {
      photo.button.addEventListener("click", () => this.open(i));
    });

    this.dialog.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action) this[action]();
      else if (event.target === this.dialog) this.close();
    });

    this.dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") this.next();
      if (event.key === "ArrowLeft") this.prev();
    });

    this.dialog.addEventListener("touchstart", (event) => {
      this.touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    this.dialog.addEventListener("touchend", (event) => {
      if (this.touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(distance) > 50) distance < 0 ? this.next() : this.prev();
      this.touchStartX = null;
    });

    // Devolve o foco para a foto que abriu o modal
    this.dialog.addEventListener("close", () => this.photos[this.index].button.focus());
  }

  async show(i) {
    this.index = (i + this.photos.length) % this.photos.length;
    const current = this.index;
    const { src, alt } = this.photos[current];

    // Troca foto e legenda juntas, só depois que a imagem nova estiver pronta
    const next = new Image();
    next.src = src;
    await next.decode().catch(() => {});
    if (current !== this.index) return; // usuário já avançou de novo

    this.image.src = src;
    this.image.alt = alt;
    this.caption.textContent = `${alt} (${current + 1} de ${this.photos.length})`;

    // Pré-carrega a próxima para a navegação ficar instantânea
    new Image().src = this.photos[(current + 1) % this.photos.length].src;
  }

  open(i) {
    this.show(i);
    this.dialog.showModal();
  }

  close() { this.dialog.close(); }
  next() { this.show(this.index + 1); }
  prev() { this.show(this.index - 1); }
}

/* -------------------------------------------------------------------------
   Reserva: valida o formulário e abre o WhatsApp com a mensagem pronta
   ------------------------------------------------------------------------- */
const toISODate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");

function setupBooking(form) {
  const checkin = form.elements.checkin;
  const checkout = form.elements.checkout;
  const errorBox = form.querySelector("#booking-error");

  const today = toISODate(new Date());
  checkin.min = today;
  checkout.min = today;

  checkin.addEventListener("change", () => {
    checkout.min = checkin.value || today;
    if (checkout.value && checkout.value <= checkin.value) checkout.value = "";
  });

  const fail = (field, message) => {
    field.setAttribute("aria-invalid", "true");
    errorBox.textContent = message;
    errorBox.hidden = false;
    field.focus();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    errorBox.hidden = true;

    const { name, guests, occasion } = form.elements;
    const people = Number(guests.value);

    if (!checkin.value) return fail(checkin, "Escolha a data de chegada.");
    if (!checkout.value) return fail(checkout, "Escolha a data de saída.");
    if (checkout.value <= checkin.value) return fail(checkout, "A saída precisa ser depois da chegada.");
    if (!people || people < 1) return fail(guests, "Informe quantas pessoas vão.");
    if (people > 50) return fail(guests, "O salão comporta até 50 pessoas.");
    if (!name.value.trim()) return fail(name, "Informe seu nome.");

    const message = [
      `Olá, Wagner! Sou ${name.value.trim()} e quero reservar a chácara.`,
      `Chegada: ${formatDate(checkin.value)}`,
      `Saída: ${formatDate(checkout.value)}`,
      `Pessoas: ${people}`,
      `Ocasião: ${occasion.value}`,
      "A data está disponível?",
    ].join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
}

/* ------------------------------------------------------------------------- */
const dialog = document.querySelector("#lightbox");
const triggers = document.querySelectorAll(".gallery__open");
if (dialog && triggers.length) new Lightbox(dialog, triggers);

const booking = document.querySelector("#booking");
if (booking) setupBooking(booking);

// Botão fixo do celular só aparece depois que o topo da página sai da tela
const mobileCta = document.querySelector(".mobile-cta");
const hero = document.querySelector(".hero");
const reserva = document.querySelector("#reserva");
if (mobileCta && hero && reserva && "IntersectionObserver" in window) {
  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
    mobileCta.dataset.visible = String(visible.size === 0);
  });
  observer.observe(hero);
  observer.observe(reserva);
} else if (mobileCta) {
  mobileCta.dataset.visible = "true";
}

document.querySelector("#year").textContent = new Date().getFullYear();
