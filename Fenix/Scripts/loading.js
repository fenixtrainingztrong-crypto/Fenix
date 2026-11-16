
document.addEventListener("DOMContentLoaded", () => {

    const progress = document.querySelector(".loading-progress");
    const mensagem = document.querySelector(".loading-content p");
    const porcentagem = document.querySelector(".loading-content span");

    let valor = 0;

    const carregamento = setInterval(() => {

        valor += 1;

        progress.style.width = valor + "%";

        porcentagem.textContent = valor + "%";

        if (valor >= 100) {

            clearInterval(carregamento);

            mensagem.textContent = "Seu treino está pronto!";

            porcentagem.textContent = "Carregamento concluído.";

        }

    }, 50);

});