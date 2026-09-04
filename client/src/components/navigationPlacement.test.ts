import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readComponent = (name: string) =>
  readFileSync(resolve(process.cwd(), "client/src/components", name), "utf8");

describe("posicionamento do Posto de Comando", () => {
  it("mantem o acesso desktop junto da identidade e fora da navegacao de paginas", () => {
    const source = readComponent("Navbar.tsx");
    const commandSettingsLinks =
      source.match(/data-navigation-role="desktop-command-settings"/g) ?? [];
    const pageNavigationStart = source.indexOf('<nav className="flex w-full');
    const pageNavigationEnd = source.indexOf("</nav>", pageNavigationStart);
    const pageNavigation = source.slice(pageNavigationStart, pageNavigationEnd);

    expect(commandSettingsLinks).toHaveLength(2);
    expect(pageNavigation).not.toContain('href="/xerife"');
  });

  it("mantem o acesso mobile na grade e deixa a faixa da conta isolada", () => {
    const source = readComponent("BottomNavigation.tsx");
    const gridDefinitionStart = source.indexOf("const allGridItems");
    const commandGridEnd = source.indexOf(
      ": isStudent",
      gridDefinitionStart
    );
    const commandGrid = source.slice(gridDefinitionStart, commandGridEnd);
    const accountFooter = source.slice(
      source.indexOf("Rodapé de Identificação da Sessão")
    );

    expect(commandGrid).toContain('{ icon: Star, label: "Posto Comando", path: "/xerife" }');
    expect(accountFooter).not.toContain('onClick={() => goTo("/xerife")}');
  });
});
