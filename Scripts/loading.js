
document.addEventListener("DOMContentLoaded", () => {

    const progress = document.querySelector(".loading-progress");
    const mensagem = document.querySelector(".loading-content p");
    const status = document.querySelector(".loading-status");

    if (!progress || !mensagem || !status) {
        console.error("Elementos da tela de carregamento não encontrados.");
        return;
    }

    let valor = 0;

    const carregamento = setInterval(() => {
    valor++;

            progress.style.width = valor + "%";
             status.textContent = valor + "%";

        if (valor >= 100) {

            clearInterval(carregamento);

            mensagem.textContent = "Seu treino está pronto!";
            status.textContent = "Carregamento concluído.";

        }

    }, 50);
    });