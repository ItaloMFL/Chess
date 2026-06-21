var posicao = 0;
var mensagem = "Sua mensagem aqui                      "; //Esse texto



function rola() {
    document.getElementById("lugar").innerHTML =
        mensagem.substring(posicao, mensagem, length);
    posicao++;
    if (posicao == mensagem.length) {
        posicao = 0;
    }
    setTimeout("rola()", 130);
}

function random_rgba() {
    var o = Math.round,
        r = Math.random,
        s = 255;
    return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + r().toFixed(1) + ')';
};

function RandomTextColor() {
    document.getElementById("lugar").style.color = random_rgba();
}