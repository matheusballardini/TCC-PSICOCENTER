// Efeito sutil de "chegando": elementos com a classe .reveal só ganham
// opacidade/posição final quando entram na tela, em vez de aparecerem de vez.
document.addEventListener('DOMContentLoaded', () => {
    const elementos = document.querySelectorAll('.reveal');
    if (!elementos.length) return;

    if (!('IntersectionObserver' in window)) {
        elementos.forEach((el) => el.classList.add('visivel'));
        return;
    }

    const observer = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visivel');
                observer.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15 });

    elementos.forEach((el) => observer.observe(el));
});
