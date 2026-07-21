import { CircleHelp, Menu } from "lucide-react";
import { Brand } from "./Brand";

export function Header() {
  return (
    <header className="header" id="top">
      <div className="header__inner">
        <Brand />
        <p className="header__promise">Find a fair way forward.</p>
        <nav className="header__nav" aria-label="Primary navigation">
          <a href="#results">Trips</a>
          <a href="#advisory"><CircleHelp size={18} /> Help</a>
          <button className="avatar" aria-label="Account menu">EM</button>
        </nav>
        <button className="menu-button" aria-label="Open navigation"><Menu /></button>
      </div>
    </header>
  );
}
