import { createButton } from "./Components/Button/button.js";

export function App() {
    const container = document.createElement('div');

    const btn = createButton({
        text: 'Clique',
        onClick: () => alert('Funcionou!')
    });

    container.append(btn);

    return container;
}