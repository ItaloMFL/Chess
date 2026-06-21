# Chess

## 2. Estrutura de pastas (exemplo para um projeto de médio porte)

```text
meu-projeto/
├── public/
│   └── index.html          # Ponto de entrada (HTML mínimo)
├── src/
│   ├── assets/             # Imagens, fontes, ícones
│   │
│   ├── components/         # Componentes reutilizáveis (UI)
│   │   ├── Button/
│   │   │   ├── Button.js
│   │   │   ├── Button.css
│   │   │   └── index.js
│   │   ├── Board/
│   │   │   ├── Board.js
│   │   │   ├── Board.css
│   │   │   └── index.js
│   │   └── ...
│   │
│   ├── styles/             # Estilos globais, variáveis, temas
│   │   ├── variables.css
│   │   ├── reset.css
│   │   └── global.css
│   │
│   ├── lib/                # Lógica de negócio (independente de UI)
│   │   ├── chess/
│   │   │   ├── game.js     # Estado, regras, movimentos
│   │   │   ├── ai.js       # IA (minimax)
│   │   │   ├── constants.js    # UNICODE_PIECES, PIECE_VALUES, PST
│   │   │   └── utils.js        # isInBounds, findKing, cloneBoard, etc.
│   │   └── utils/          # Funções auxiliares genéricas
│   │       ├── array.js
│   │       └── math.js
│   │
│   ├── services/           # Comunicação com APIs, armazenamento
│   │   └── storage.js
│   │
│   ├── app.js              # Orquestrador principal
│   └── main.js             # Ponto de entrada (inicialização)
│
├── tests/                  # Testes unitários e de integração
│   ├── unit/               # Testes de unidades (funções isoladas)
│   └── integration/        # Testes de integração (vários módulos juntos)
│   └── e2e/                # Testes end-to-end (opcional, simula usuário)
│
├── .eslintrc.js            # Configuração de lint
├── .prettierrc             # Formatação
├── vite.config.js          # Ou webpack.config.js
├── package.json
└── README.md
```

## 3. HTML – manter o mínimo e usar templates

O HTML deve ser apenas um "esqueleto" com poucos elementos, e o restante deve ser gerado dinamicamente via JavaScript. Isso facilita a reutilização e a manutenção.

Exemplo de `public/index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chess Royale</title>
  <!-- CSS será injetado pelo build ou importado via JS -->
</head>
<body>
  <div id="app">
    <!-- A UI será renderizada aqui pelo JavaScript -->
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Para reutilizar HTML**, você pode criar componentes que geram seu próprio HTML via JavaScript (ex: usando innerHTML ou Template Literals).

Exemplo de componente `Button`:

```js
// src/components/Button/Button.js
export function Button({ label, onClick, className = '' }) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = `btn ${className}`;
  btn.addEventListener('click', onClick);
  return btn;
}
```

E para reutilizar, você importa e usa em qualquer lugar.

## 4. CSS – modular, com variáveis e metodologia

### Use variáveis CSS para temas

```css
/* src/styles/variables.css */
:root {
  --color-primary: #2c3e50;
  --color-secondary: #e74c3c;
  --font-family: 'Inter', sans-serif;
  --spacing: 8px;
} 
```

### Metodologia BEM ou Atomic Design

- BEM (Block, Element, Modifier) ajuda a nomear classes de forma consistente e evita conflitos.

- Exemplo: `.board__square--selected`

### CSS modular por componente

Cada componente tem seu próprio arquivo CSS, importado apenas quando necessário.
No JavaScript, você pode importar o CSS (se estiver usando um bundler) ou injetar estilos dinamicamente.

```css
/* src/components/Board/Board.css */
.board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}
.board__square {
  width: 60px;
  height: 60px;
}
.board__square--light { background: #f0d9b5; }
.board__square--dark { background: #b58863; }
```

E no componente JS:

```js
import './Board.css'; // O bundler vai incluir no build
``` 

### Pré-processadores (opcional)

Sass/Less ajudam a aninhar e usar mixins, mas hoje o CSS puro com variáveis e @import já é bem poderoso. Se quiser, pode usar PostCSS para autoprefix e futuras features.

## 5. JavaScript – modular, com classes ou funções puras
Separe a lógica de negócio da UI

- Camada de domínio: regras do xadrez, IA, estado do jogo (não sabem que existe um navegador).

- Camada de apresentação: componentes, renderização, eventos (sabem sobre o *DOM*, mas não sobre as regras).

Exemplo:

```javascript
// src/lib/chess/game.js
export class ChessGame {
    constructor() {
        this.board = initBoard();
        this.turn = 'w';
        // ...
    }
    
    makeMove(from, to) { /* ... */ }
    getLegalMoves(row, col) { /* ... */ }
}

// src/components/Board/Board.js
import { ChessGame } from '../../lib/chess/game.js';

export function renderBoard(game) {
// usa game.board, game.turn etc. para desenhar
}
``` 
### Use módulos *ES6* (import/export) para organizar

- Cada arquivo exporta apenas o necessário.

- Evite variáveis globais (window). Se precisar, use um objeto de configuração ou injeção de dependência.

### Padrões de design úteis

- Observer/EventEmitter para comunicação entre componentes (ex: quando o jogo muda, notifica a UI para atualizar).

- Factory para criar peças ou configurações.

- Singleton para o estado do jogo (mas cuidado com acoplamento).

### Testes

- Escreva testes para a lógica de negócio (ex: movimentos legais, xeque-mate) e testes de integração para a UI.
- Ferramentas: Jest, Vitest, Testing Library.

## 6. Reutilização de código – exemplos práticos

Criando um componente genérico de botão
javascript

```js
// src/components/Button/Button.js
export function createButton({ text, type = 'button', onClick, classes = '' }) {
  const btn = document.createElement('button');
  btn.type = type;
  btn.textContent = text;
  btn.className = `btn ${classes}`;
  btn.addEventListener('click', onClick);
  return btn;
}
```
Use em vários lugares:

```js
import { createButton } from './components/Button/Button.js';

const newGameBtn = createButton({
  text: 'Novo Jogo',
  onClick: resetGame,
  classes: 'btn-primary'
});

Reutilizando lógica de validação
javascript

// src/lib/utils/validation.js
export function isInBounds(row, col) {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}
``` 
Importe onde precisar.

### Reutilizando estilos

Crie classes utilitárias (ex: .text-center, .mt-2, .flex) e combine com classes específicas.