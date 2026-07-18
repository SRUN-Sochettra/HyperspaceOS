export const funCommands = {
  banner: {
    description: "Print large text",
    execute({ args, terminal }) {
      if (args.length === 0) {
        terminal.writeLine("error", "banner: missing text");
        return;
      }
      const text = args.join(" ").toUpperCase();
      const font = {
        'A': ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
        'B': ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
        'C': [' CCC ', 'C   C', 'C    ', 'C   C', ' CCC '],
        'D': ['DDDD ', 'D   D', 'D   D', 'D   D', 'DDDD '],
        'E': ['EEEEE', 'E    ', 'EEEE ', 'E    ', 'EEEEE'],
        'F': ['FFFFF', 'F    ', 'FFFF ', 'F    ', 'F    '],
        'G': [' GGG ', 'G    ', 'G  GG', 'G   G', ' GGG '],
        'H': ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
        'I': [' III ', '  I  ', '  I  ', '  I  ', ' III '],
        'J': ['   JJ', '    J', '    J', 'J   J', ' JJJ '],
        'K': ['K   K', 'K  K ', 'KKK  ', 'K  K ', 'K   K'],
        'L': ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
        'M': ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
        'N': ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
        'O': [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
        'P': ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
        'Q': [' QQQ ', 'Q   Q', 'Q   Q', 'Q  QQ', ' QQQQ'],
        'R': ['RRRR ', 'R   R', 'RRRR ', 'R  R ', 'R   R'],
        'S': [' SSSS', 'S    ', ' SSS ', '    S', 'SSSS '],
        'T': ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
        'U': ['U   U', 'U   U', 'U   U', 'U   U', ' UUU '],
        'V': ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
        'W': ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
        'X': ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
        'Y': ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
        'Z': ['ZZZZZ', '   Z ', '  Z  ', ' Z   ', 'ZZZZZ'],
        ' ': ['     ', '     ', '     ', '     ', '     '],
        '!': ['  !  ', '  !  ', '  !  ', '     ', '  !  '],
        '?': [' ??? ', '    ?', '  ?  ', '     ', '  ?  '],
        '-': ['     ', '     ', ' --- ', '     ', '     '],
        '.': ['     ', '     ', '     ', '     ', '  .  '],
      };

      for (let i = 0; i < 5; i++) {
        let line = "";
        for (const char of text) {
          const charPattern = font[char] || font['?'];
          line += charPattern[i] + "  ";
        }
        terminal.writeLine("output", line);
      }
    },
  },

  rps: {
    description: "Rock Paper Scissors",
    execute({ args, terminal }) {
      const RPS_CHOICES = ["rock", "paper", "scissors"];
      const RPS_OUTCOMES = {
        rock: { rock: "draw", paper: "lose", scissors: "win" },
        paper: { rock: "win", paper: "draw", scissors: "lose" },
        scissors: { rock: "lose", paper: "draw", scissors: "win" },
      };

      const choice = args[0]?.trim().toLowerCase();
      if (!choice || !RPS_CHOICES.includes(choice)) {
        terminal.writeLine("error", `Usage: rps <rock|paper|scissors>`);
        return;
      }

      const computerChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
      const outcome = RPS_OUTCOMES[choice][computerChoice];

      const outcomeMessages = {
        win: "You win!",
        lose: "You lose!",
        draw: "It's a draw!",
      };

      terminal.writeLine("output", `You chose: ${choice} | Computer chose: ${computerChoice}`);
      terminal.writeLine(outcome === "win" ? "success" : outcome === "lose" ? "error" : "info", outcomeMessages[outcome]);
    }
  },

  magic8ball: {
    description: "Ask the Magic 8-Ball a question",
    execute({ args, terminal }) {
      if (args.length === 0) {
        terminal.writeLine("error", "magic8ball: ask a question first!");
        return;
      }
      const answers = [
        "It is certain.", "It is decidedly so.", "Without a doubt.",
        "Yes definitely.", "You may rely on it.", "As I see it, yes.",
        "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
        "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
        "Cannot predict now.", "Concentrate and ask again.",
        "Don't count on it.", "My reply is no.", "My sources say no.",
        "Outlook not so good.", "Very doubtful."
      ];
      terminal.writeLine("output", "🎱 " + answers[Math.floor(Math.random() * answers.length)]);
    },
  },

  sl: {
    description: "Steam Locomotive",
    execute({ terminal }) {
      const train = [
        "      ====        ________                ___________ ",
        "  _D _|  |_______/        \\__I_I_____===__|_________|",
        "   |(_)---  |   H\\________/ |   |        =|___ ___|   ",
        "   /     |  |   H  |  |     |   |         ||_| |_||   ",
        "  |      |  |   H  |__--------------------| [___] |   ",
        "  | ________|___H__/__|_____/[][]~\\_______|       |   ",
        "  |/ |   |-----------I_____I [][] []  D   |=======|__ ",
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\O=====O=====O=====O_/      \\_/            "
      ];
      train.forEach(line => terminal.writeLine("output", line));
    },
  },

  matrix: {
    description: "Display Matrix rain",
    execute({ terminal }) {
      const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z";
      for (let i = 0; i < 10; i++) {
        let line = "";
        for (let j = 0; j < 55; j++) {
          line += chars[Math.floor(Math.random() * chars.length)];
        }
        terminal.writeLine("success", line);
      }
    },
  },

  joke: {
    description: "Tell a programming joke",
    execute({ terminal }) {
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "There are 10 types of people: those who understand binary and those who don't.",
        'A SQL query walks into a bar and asks two tables: "Can I join you?"',
        "Why was the JS developer sad? He didn't Node how to Express himself.",
        "!false — it's funny because it's true.",
        "How many programmers to change a lightbulb? None — that's a hardware problem.",
        "A QA engineer walks into a bar. Orders 1 beer. Orders 0 beers. Orders -1 beers.",
        '"Knock knock." "Who\'s there?" ... long pause ... "Java."',
      ];
      terminal.writeLine(
        "output",
        jokes[Math.floor(Math.random() * jokes.length)],
      );
    },
  },

  cowsay: {
    description: "ASCII cow says your message",
    execute({ args, terminal }) {
      const msg = args.join(" ") || "Moo!";
      const border = "─".repeat(msg.length + 2);
      terminal.writeLine("output", ` ┌${border}┐`);
      terminal.writeLine("output", ` │ ${msg} │`);
      terminal.writeLine("output", ` └${border}┘`);
      terminal.writeLine("output", "        \\   ^__^");
      terminal.writeLine("output", "         \\  (oo)\\_______");
      terminal.writeLine("output", "            (__)\\       )\\/\\");
      terminal.writeLine("output", "                ||----w |");
      terminal.writeLine("output", "                ||     ||");
    },
  },

  flip: {
    description: "Flip a coin",
    execute({ terminal }) {
      terminal.writeLine(
        "output",
        Math.random() > 0.5 ? "🪙 Heads!" : "🪙 Tails!",
      );
    },
  },

  roll: {
    description: "Roll dice (e.g. roll 2d6)",
    execute({ args, terminal }) {
      const notation = args[0] || "1d6";
      const match = notation.match(/^(\d+)d(\d+)$/i);
      if (!match) {
        terminal.writeLine("error", "roll: use format NdN  e.g. roll 2d6");
        return;
      }
      const count = Math.min(parseInt(match[1]), 20);
      const sides = parseInt(match[2]);
      const rolls = Array.from(
        { length: count },
        () => Math.floor(Math.random() * sides) + 1,
      );
      const total = rolls.reduce((a, b) => a + b, 0);
      terminal.writeLine("output", `🎲 [${rolls.join(", ")}]`);
      terminal.writeLine("success", `Total: ${total}`);
    },
  },

  fortune: {
    description: "Random fortune",
    execute({ terminal }) {
      const list = [
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "You will deploy to production on a Friday. It will be fine. (Probably.)",
        "A bug is just an undocumented feature waiting to be appreciated.",
        "Your next side project will actually get finished. (Just kidding.)",
        "The code you write today is the legacy code of tomorrow.",
        "You will find the missing semicolon. Eventually.",
      ];
      terminal.writeLine(
        "info",
        "🔮 " + list[Math.floor(Math.random() * list.length)],
      );
    },
  },

  color: {
    description: "Show terminal color palette",
    execute({ terminal }) {
      terminal.writeLine("command", "  command  — input echo");
      terminal.writeLine("output", "  output   — default text");
      terminal.writeLine("info", "  info     — highlights");
      terminal.writeLine("success", "  success  — success / green");
      terminal.writeLine("error", "  error    — errors / red");
    },
  },

  play: {
    description: "Launch an arcade game (snake, pong, flappy, tetris, 2048, breakout, tictactoe, minesweeper, asteroids)",
    execute({ args, terminal }) {
      const game = args[0];
      const validGames = ['snake', 'pong', 'flappy', 'tetris', '2048', 'breakout', 'tictactoe', 'minesweeper', 'asteroids'];
      if (!game || !validGames.includes(game.toLowerCase())) {
        terminal.writeLine("error", "play: specify a valid game: snake, pong, flappy, tetris, 2048, breakout, tictactoe, minesweeper, asteroids");
        return;
      }

      // We must dynamically import Registry and EventBus just like 'apps.js' does, or they might not be available
      import("../../../core/Registry.js").then(({ default: Registry }) => {
        import("../../../core/EventBus.js").then(({ default: EventBus }) => {
            Registry.launch("games");
            // Delay slightly to ensure window is spawned, then trigger game
            setTimeout(() => {
                EventBus.emit("games:start", game.toLowerCase());
            }, 100);
            terminal.writeLine("success", `Launching ${game}...`);
        });
      });
    },
  },
};