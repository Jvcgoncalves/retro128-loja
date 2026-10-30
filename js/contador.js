/*
 * contador.js — contador regressivo da campanha Black Friday
 *
 * Desenvolvido na sprint 14. Fica desligado até a campanha ser ativada
 * (ver RET-203). Analytics usa historicoContador para medir
 * jogos visíveis, com retenção limitada às últimas 60 amostras.
 */

const historicoContador = [];
const LIMITE_HISTORICO_CONTADOR = 60;
let temporizadorContador = null;

function formatarTempo(ms) {
  const total = Math.floor(ms / 1000);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const dois = (n) => String(n).padStart(2, '0');
  return `<b>${dias}</b>d <b>${dois(horas)}</b>h <b>${dois(minutos)}</b>m <b>${dois(segundos)}</b>s`;
}

function iniciarContador(campanha) {
  if (temporizadorContador !== null) {
    clearInterval(temporizadorContador);
    temporizadorContador = null;
  }

  const banner = document.getElementById('banner-bf');
  const alvo = banner.querySelector('.bf-tempo');
  const grade = document.getElementById('grade');
  const fim = new Date(campanha.fim).getTime();
  const intervaloMs = Math.max(1, Number(campanha.intervaloContadorSegundos) || 1) * 1000;
  banner.hidden = false;

  Observabilidade.registrarMedidor('historico_contador', () => historicoContador.length);

  function tick() {
    const instante = Date.now();
    const restante = Math.max(0, fim - instante);
    historicoContador.push({
      instante,
      restante: restante,
      jogosVisiveis: [...grade.querySelectorAll('.card')].map((card) => card.dataset.id)
    });
    if (historicoContador.length > LIMITE_HISTORICO_CONTADOR) {
      historicoContador.shift();
    }
    Observabilidade.contar('contador_ticks');
    alvo.innerHTML = formatarTempo(restante);

    if (restante === 0 && temporizadorContador !== null) {
      clearInterval(temporizadorContador);
      temporizadorContador = null;
    }
  }

  tick();
  Observabilidade.info('CONTADOR_INICIADO', 'Contador da Black Friday ativo', {
    fim: campanha.fim, intervalo: campanha.intervaloContadorSegundos
  });
  if (fim > Date.now()) {
    temporizadorContador = setInterval(tick, intervaloMs);
  }
  return temporizadorContador;
}
