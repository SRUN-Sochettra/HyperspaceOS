export const funCommands = {

    matrix: {
        description: 'Display Matrix rain',
        execute({ terminal }) {
            const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z'
            for (let i = 0; i < 10; i++) {
                let line = ''
                for (let j = 0; j < 55; j++) {
                    line += chars[Math.floor(Math.random() * chars.length)]
                }
                terminal.writeLine('success', line)
            }
        }
    },

    joke: {
        description: 'Tell a programming joke',
        execute({ terminal }) {
            const jokes = [
                'Why do programmers prefer dark mode? Because light attracts bugs.',
                'There are 10 types of people: those who understand binary and those who don\'t.',
                'A SQL query walks into a bar and asks two tables: "Can I join you?"',
                'Why was the JS developer sad? He didn\'t Node how to Express himself.',
                '!false — it\'s funny because it\'s true.',
                'How many programmers to change a lightbulb? None — that\'s a hardware problem.',
                'A QA engineer walks into a bar. Orders 1 beer. Orders 0 beers. Orders -1 beers.',
                '"Knock knock." "Who\'s there?" ... long pause ... "Java."',
            ]
            terminal.writeLine('output', jokes[Math.floor(Math.random() * jokes.length)])
        }
    },

    cowsay: {
        description: 'ASCII cow says your message',
        execute({ args, terminal }) {
            const msg = args.join(' ') || 'Moo!'
            const border = '─'.repeat(msg.length + 2)
            terminal.writeLine('output', ` ┌${border}┐`)
            terminal.writeLine('output', ` │ ${msg} │`)
            terminal.writeLine('output', ` └${border}┘`)
            terminal.writeLine('output', '        \\   ^__^')
            terminal.writeLine('output', '         \\  (oo)\\_______')
            terminal.writeLine('output', '            (__)\\       )\\/\\')
            terminal.writeLine('output', '                ||----w |')
            terminal.writeLine('output', '                ||     ||')
        }
    },

    flip: {
        description: 'Flip a coin',
        execute({ terminal }) {
            terminal.writeLine('output', Math.random() > 0.5 ? '🪙 Heads!' : '🪙 Tails!')
        }
    },

    roll: {
        description: 'Roll dice (e.g. roll 2d6)',
        execute({ args, terminal }) {
            const notation = args[0] || '1d6'
            const match = notation.match(/^(\d+)d(\d+)$/i)
            if (!match) {
                terminal.writeLine('error', 'roll: use format NdN  e.g. roll 2d6')
                return
            }
            const count = Math.min(parseInt(match[1]), 20)
            const sides = parseInt(match[2])
            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
            const total = rolls.reduce((a, b) => a + b, 0)
            terminal.writeLine('output', `🎲 [${rolls.join(', ')}]`)
            terminal.writeLine('success', `Total: ${total}`)
        }
    },

    fortune: {
        description: 'Random fortune',
        execute({ terminal }) {
            const list = [
                'The best time to plant a tree was 20 years ago. The second best time is now.',
                'You will deploy to production on a Friday. It will be fine. (Probably.)',
                'A bug is just an undocumented feature waiting to be appreciated.',
                'Your next side project will actually get finished. (Just kidding.)',
                'The code you write today is the legacy code of tomorrow.',
                'You will find the missing semicolon. Eventually.',
            ]
            terminal.writeLine('info', '🔮 ' + list[Math.floor(Math.random() * list.length)])
        }
    },

    color: {
        description: 'Show terminal color palette',
        execute({ terminal }) {
            terminal.writeLine('command', '  command  — input echo')
            terminal.writeLine('output', '  output   — default text')
            terminal.writeLine('info', '  info     — highlights')
            terminal.writeLine('success', '  success  — success / green')
            terminal.writeLine('error', '  error    — errors / red')
        }
    },
}