// Barrinha que desliza sob o link do menu: fica parada embaixo da página atual
// (a.active) e "anda" até o link que o mouse está sobre, voltando quando sai.
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.querySelector('.menu, .topo-fino');
    if (!menu) return;

    const links = Array.from(menu.querySelectorAll('a')).filter((a) => !a.classList.contains('botao-entrar'));
    if (!links.length) return;

    const indicador = document.createElement('span');
    indicador.className = 'nav-indicator';
    menu.appendChild(indicador);

    const ativo = links.find((a) => a.classList.contains('active')) || null;

    function moverPara(link) {
        if (!link || window.innerWidth <= 900) {
            indicador.classList.remove('pronto');
            return;
        }
        const menuRect = menu.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicador.style.left = (linkRect.left - menuRect.left) + 'px';
        indicador.style.width = linkRect.width + 'px';
        indicador.classList.add('pronto');
    }

    links.forEach((link) => {
        link.addEventListener('mouseenter', () => moverPara(link));
    });
    menu.addEventListener('mouseleave', () => moverPara(ativo));
    window.addEventListener('resize', () => moverPara(ativo));

    // espera o layout (fontes, animações de entrada) assentar antes de medir a posição
    requestAnimationFrame(() => moverPara(ativo));
});
