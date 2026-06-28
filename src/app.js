import { createButton } from "./Components/Button/button.js";
import { createGameContainer } from "./Components/GameContainer/GameContainer.js";

export function App() {
    const gameContainer = createGameContainer();
    gameContainer.className = 'game-container';

    const btn = createButton({
        text: 'Clique',
        onClick: () => alert('Funcionou!')
    });

    gameContainer.append(btn);

    return gameContainer;
}