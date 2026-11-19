import { STAGE_FALLBACK_QUIZZES, type QuizQuestionItem } from './local-mentor.ts';
import { STAGES_DATA } from './curriculum-data.ts';

export type LogicGateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'XNOR';

export interface BinaryLabConfig {
  type: 'binary-switches';
  prompt: string;
  targetUnsigned: number;
  hint: string;
  explainAfterSolve: string;
}

export interface LogicGateLabConfig {
  type: 'logic-gates';
  prompt: string;
  requiredGate?: LogicGateType;
  targetOutput: boolean;
  mustUseNonZeroInputs?: boolean;
  hint: string;
  explainAfterSolve: string;
}

export interface TraceFrameStep {
  lineLabel: string;
  codeLine: string;
  variables: { name: string; value: string; note?: string }[];
  explanation: string;
}

export interface TraceStepperLabConfig {
  type: 'trace-stepper';
  prompt: string;
  languageLabel: string;
  steps: TraceFrameStep[];
  checkpointQuestion: string;
  options: string[];
  correctIndex: number;
  explainAfterSolve: string;
}

export interface DiagnosticOption {
  id: string;
  label: string;
  detail: string;
  isCorrect: boolean;
  feedback: string;
}

export interface SystemDiagnosticLabConfig {
  type: 'system-diagnostic';
  prompt: string;
  artifactTitle: string;
  artifactBody: string;
  options: DiagnosticOption[];
  explainAfterSolve: string;
}

export type RealmInteractiveLab =
  | BinaryLabConfig
  | LogicGateLabConfig
  | TraceStepperLabConfig
  | SystemDiagnosticLabConfig;

export interface AdventureRealm {
  stageId: string;
  chapterNumber: number;
  realmName: string;
  bossName: string;
  tierLabel: 'Zero-CS Spark' | 'Core Foundations' | 'Systems Builder' | 'Mastery Frontier';
  storyHook: string;
  zeroJargonAnalogy: string;
  firstPrinciples: string[];
  commonBeginnerTrap: string;
  interactiveLab: RealmInteractiveLab;
  bossIntroQuestion: QuizQuestionItem;
  playgroundStarter: {
    language: 'python' | 'c';
    title: string;
    code: string;
  };
  shellStarterCommand?: string;
  showAlgoVisualizerButton?: boolean;
  xpClearReward: number;
}

export const ADVENTURE_REALMS: AdventureRealm[] = [
  {
    stageId: 'stage-0',
    chapterNumber: 0,
    realmName: 'Circuit Valley',
    bossName: 'The Binary Gatekeeper',
    tierLabel: 'Zero-CS Spark',
    storyHook:
      'Every smartphone, game console, and server begins with billions of microscopic light switches that only understand ON (1) or OFF (0). Flip real switches to speak the machine’s native tongue.',
    zeroJargonAnalogy:
      'Imagine 8 light switches on a wall labeled 128, 64, 32, 16, 8, 4, 2, 1 from left to right. Every number—and every letter like "A"—is just the sum of the switches you turn ON.',
    firstPrinciples: [
      'A bit is a single switch (0 or 1); 8 bits together form 1 byte capable of storing values from 0 to 255.',
      'Binary is Base-2: moving one switch left doubles its weight (1 -> 2 -> 4 -> 8 -> 16 -> 32 -> 64 -> 128).',
      'Text characters use ASCII/UTF-8 tables: uppercase "A" is stored in RAM literally as decimal 65 (01000001).',
      'Hexadecimal (Base-16) compresses 4 bits into one digit (0–9, A–F) so 1 byte is always 2 clean hex characters.',
    ],
    commonBeginnerTrap:
      'Thinking "01000001" is text inside hardware—CPU circuits store raw voltage levels representing 65; software interprets 65 as "A" only when printing text.',
    interactiveLab: {
      type: 'binary-switches',
      prompt: 'Mission: Flip the 8-bit switches to encode ASCII uppercase "A" (Decimal 65 · Hex 0x41).',
      targetUnsigned: 65,
      hint: '65 = 64 + 1. Turn ON the 64 switch and the 1 switch, leaving all others OFF.',
      explainAfterSolve:
        '01000001 = 64 + 1 = 65 (0x41). You just encoded a real ASCII byte using pure hardware place values!',
    },
    bossIntroQuestion: {
      question: 'You inspect raw memory and find the 8-bit pattern 00101010. What decimal number is stored?',
      options: ['24', '42', '52', '84'],
      correctIndex: 1,
      explanation: '32 + 8 + 2 = 42. Each ON bit adds its power-of-2 column weight (128, 64, 32, 16, 8, 4, 2, 1).',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Inspect Binary, Hex & ASCII in Python',
      code: `# Chapter 0 Starter: See how computers store numbers & letters
for ch in "CS!":
    code = ord(ch)
    print(f"Char '{ch}' -> Decimal: {code:3d} | Hex: {hex(code)} | Binary: {code:08b}")
`,
    },
    xpClearReward: 120,
  },
  {
    stageId: 'stage-1',
    chapterNumber: 1,
    realmName: 'Syntax Meadow',
    bossName: 'The Loop Sphinx',
    tierLabel: 'Zero-CS Spark',
    storyHook:
      'Computers follow instructions literally and never guess what you meant. Learn how variables label memory boxes, decisions branch execution, and loops automate repetitive work.',
    zeroJargonAnalogy:
      'A variable is a labeled jar holding a value; an if-statement is a fork in a hiking trail; a loop is a conveyor belt repeating the same checklist until a counter finishes.',
    firstPrinciples: [
      'Variables bind clean names to typed values in memory (`int`, `float`, `str`, `bool`, `list`, `dict`).',
      'Conditionals (`if / elif / else`) evaluate boolean True/False comparisons before choosing one branch.',
      'Loops (`for` and `while`) repeat indented blocks; every `while` loop must move toward a stopping condition.',
      'Functions (`def`) bundle reusable logic with explicit input parameters and `return` outputs.',
    ],
    commonBeginnerTrap:
      'Using `print(...)` inside a function instead of `return ...`, which leaves callers holding `None` instead of the computed answer.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Step through how an accumulator variable changes inside a Python loop, then answer the checkpoint.',
      languageLabel: 'Python 3 Trace',
      steps: [
        {
          lineLabel: 'Line 1',
          codeLine: 'total = 0',
          variables: [{ name: 'total', value: '0', note: 'Initialized' }],
          explanation: 'Creates the label `total` pointing to integer 0.',
        },
        {
          lineLabel: 'Line 2 (iter 1)',
          codeLine: 'for n in [2, 4, 6]: total += n',
          variables: [
            { name: 'n', value: '2' },
            { name: 'total', value: '2', note: '0 + 2' },
          ],
          explanation: 'First item `n = 2` is added to `total`.',
        },
        {
          lineLabel: 'Line 2 (iter 2)',
          codeLine: 'for n in [2, 4, 6]: total += n',
          variables: [
            { name: 'n', value: '4' },
            { name: 'total', value: '6', note: '2 + 4' },
          ],
          explanation: 'Second item `n = 4` updates `total` to 6.',
        },
        {
          lineLabel: 'Line 2 (iter 3)',
          codeLine: 'for n in [2, 4, 6]: total += n',
          variables: [
            { name: 'n', value: '6' },
            { name: 'total', value: '12', note: '6 + 6' },
          ],
          explanation: 'Final item `n = 6` runs; loop finishes with `total == 12`.',
        },
      ],
      checkpointQuestion: 'If `[2, 4, 6]` changed to `[2, 4, 6, 8]`, what happens on the 4th iteration?',
      options: [
        'total becomes 8 because it overwrites the old sum',
        'total becomes 20 because += adds 8 onto 12',
        'Python raises IndexError',
      ],
      correctIndex: 1,
      explainAfterSolve: '`total += n` means `total = total + n`, preserving prior work across every loop step.',
    },
    bossIntroQuestion: {
      question: 'What does `def double(x): print(x * 2)` return to a caller running `res = double(5)`?',
      options: ['10', 'None (because there is no return statement)', '"55"', 'SyntaxError'],
      correctIndex: 1,
      explanation: '`print()` displays text to stdout; only `return` hands a computed value back to the caller.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Safe Grade & Dictionary Counter',
      code: `# Chapter 1 Starter: Loops, dicts, and return values
def summarize_scores(scores):
    passed = [s for s in scores if s >= 70]
    return {"count": len(scores), "passed": len(passed), "avg": sum(scores) / len(scores)}

report = summarize_scores([55, 82, 91, 68, 77])
print("Summary:", report)
`,
    },
    xpClearReward: 130,
  },
  {
    stageId: 'stage-2',
    chapterNumber: 2,
    realmName: 'Silicon Citadel',
    bossName: 'The ALU Warden',
    tierLabel: 'Zero-CS Spark',
    storyHook:
      'Step inside the processor silicon. Discover how simple logic gates add numbers, run the Fetch-Decode-Execute heartbeat, and why algorithm scaling (Big-O) beats raw clock speed.',
    zeroJargonAnalogy:
      'Think of logic gates as tiny traffic cops: AND only waves through if BOTH lanes are green; XOR waves through only when the two lanes disagree—which turns out to be binary addition!',
    firstPrinciples: [
      'AND outputs 1 only when A=1 and B=1; OR outputs 1 if either input is 1; XOR outputs 1 when inputs differ.',
      'A Half Adder builds binary arithmetic using just two gates: Sum = A XOR B, Carry = A AND B.',
      'CPUs loop endlessly: Fetch instruction from PC/RIP -> Decode opcode -> Execute inside the ALU.',
      'Algorithm choice dominates speed: O(log N) binary search checks ~20 slots out of 1,000,000, whereas O(N) checks up to 1,000,000.',
    ],
    commonBeginnerTrap:
      'Assuming faster GHz rescues an O(N^2) nested loop on large inputs—better algorithmic structure yields orders-of-magnitude gains.',
    interactiveLab: {
      type: 'logic-gates',
      prompt: 'Mission: Select the XOR gate and test disagreeing inputs (e.g. A=1, B=0) so output is 1—computing Half-Adder Sum!',
      requiredGate: 'XOR',
      targetOutput: true,
      mustUseNonZeroInputs: true,
      hint: 'Switch Gate Mode to XOR, then toggle A=ON and B=OFF (or A=OFF and B=ON).',
      explainAfterSolve:
        'XOR is the heart of binary addition (1 + 0 = 1, 1 + 1 = 0 with Carry=1 via AND).',
    },
    bossIntroQuestion: {
      question: 'When adding two bits A=1 and B=1 in a Half Adder, what are the Sum and Carry bits?',
      options: ['Sum=1, Carry=0', 'Sum=0, Carry=1 (binary 10 = decimal 2)', 'Sum=1, Carry=1', 'Sum=0, Carry=0'],
      correctIndex: 1,
      explanation: '1 + 1 in binary equals 10 (decimal 2): Sum bit is 0 (`1 XOR 1`) and Carry bit is 1 (`1 AND 1`).',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Binary Search vs Linear Scan Step Counter',
      code: `# Chapter 2 Starter: Why O(log N) crushes O(N)
arr = list(range(0, 1_000_000, 2))
target = 888_888
lo, hi, steps = 0, len(arr) - 1, 0
while lo <= hi:
    steps += 1
    mid = (lo + hi) // 2
    if arr[mid] == target:
        print(f"Found {target} at index {mid} in just {steps} steps!")
        break
    elif arr[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
`,
    },
    showAlgoVisualizerButton: true,
    xpClearReward: 140,
  },
  {
    stageId: 'stage-3',
    chapterNumber: 3,
    realmName: 'Kernel Highlands',
    bossName: 'The Daemon Chieftain',
    tierLabel: 'Core Foundations',
    storyHook:
      'Leave point-and-click GUIs behind. Command Linux directories, combine UNIX tools with pipes, configure rwx permissions safely, and track code snapshots with Git.',
    zeroJargonAnalogy:
      'Think of shell pipes (`|`) like assembly-line workers: worker 1 lists log lines, passes them by hand to `grep` to filter errors, who hands them to `wc -l` to count them.',
    firstPrinciples: [
      '`pwd`, `ls -la`, and `cd` orient and move you through the `/` hierarchy; dotfiles starting with `.` are hidden by default.',
      'UNIX permissions use 3 octal digits (Owner, Group, Others): Read=4, Write=2, Execute=1 (e.g. `chmod 750`).',
      'Standard streams (`stdin`, `stdout`, `stderr`) let commands chain seamlessly with `|` and save outputs with `>`.',
      'Git commits store immutable snapshots; always check `git status` and `git diff` before staging (`git add`).',
    ],
    commonBeginnerTrap:
      'Running `chmod 777` to "fix" permission errors—this grants write/execute to every local user and breaks security boundaries (prefer `chmod 600` for secrets, `755` for scripts).',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A script named `deploy.sh` fails with "Permission denied" when the owner runs `./deploy.sh`. Pick the least-privilege fix.',
      artifactTitle: 'Shell Telemetry · ls -la deploy.sh',
      artifactBody: '-rw-r--r-- 1 apprentice staff 412 Nov 18 deploy.sh\n$ ./deploy.sh\nbash: ./deploy.sh: Permission denied',
      options: [
        {
          id: 'chmod-777',
          label: 'Run `chmod 777 deploy.sh`',
          detail: 'World-writable + executable for every user on the system',
          isCorrect: false,
          feedback: 'Too permissive! Anyone on the host could modify your script.',
        },
        {
          id: 'chmod-u-x',
          label: 'Run `chmod u+x deploy.sh` (or `chmod 755 deploy.sh`)',
          detail: 'Adds execute permission for the owner while keeping writes restricted',
          isCorrect: true,
          feedback: 'Exact right engineering call! `u+x` grants execute bit safely without opening world writes.',
        },
        {
          id: 'cat-it',
          label: 'Run `ls -la deploy.sh` again',
          detail: 'Only prints metadata without updating mode bits',
          isCorrect: false,
          feedback: '`ls` inspects permissions but does not grant the `+x` execute bit.',
        },
      ],
      explainAfterSolve:
        'Linux separates Read (4), Write (2), and Execute (1) bits. Grant only the minimum required execute bit (`chmod u+x`).',
    },
    bossIntroQuestion: {
      question: 'Why does `cat ./-` work in Linux when `cat -` stalls waiting for keyboard input?',
      options: [
        '`.` speeds up disk reads',
        '`-` alone means stdin/flag to commands; `./-` forces path resolution to the file literally named `-`',
        '`./` automatically decrypts the file',
        '`cat` ignores dashes after midnight',
      ],
      correctIndex: 1,
      explanation: 'Prefixing `./` prevents the shell command from treating `-` as an option flag or stdin alias.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Simulate UNIX Pipe Pipeline (`grep | sort | uniq`)',
      code: `# Chapter 3 Starter: Pipe processing filter in Python
logs = [
    "INFO login ok",
    "WARN disk 85%",
    "ERROR auth failed ip=10.0.0.4",
    "ERROR auth failed ip=10.0.0.4",
    "ERROR timeout db-1",
]
errors = sorted(line for line in logs if "ERROR" in line)
print(f"Filtered {len(errors)} ERROR lines:")
for item in errors:
    print(" ->", item)
`,
    },
    shellStarterCommand: 'ls -la',
    xpClearReward: 150,
  },
  {
    stageId: 'stage-4',
    chapterNumber: 4,
    realmName: 'Packet Harbor',
    bossName: 'The SYN Sentinel',
    tierLabel: 'Core Foundations',
    storyHook:
      'Every message you send crosses physical wires, switches, routers, and TLS tunnels. Trace how DNS finds servers, TCP guarantees arrival, and subnets partition networks.',
    zeroJargonAnalogy:
      'DNS is your phone’s contact list translating a name into a number; IP routes envelopes between cities; TCP is certified mail with numbered receipts; UDP is tossing fast postcards without waiting for receipts.',
    firstPrinciples: [
      'IP addresses identify hosts (`127.0.0.1` = local machine); subnet masks (`/24` = 255.255.255.0) divide network vs host bits.',
      'Ports route traffic inside a host to a specific service: 22=SSH, 53=DNS, 80=HTTP, 443=HTTPS.',
      'TCP sets up reliable ordered streams via SYN -> SYN-ACK -> ACK; UDP prioritizes minimal latency (DNS, video).',
      'TLS/HTTPS encrypts payloads and verifies server identity certificates above TCP.',
    ],
    commonBeginnerTrap:
      'Confusing local `127.0.0.1` loopback with LAN (`192.168.x.x`) or public IPs—listening solely on `127.0.0.1` is unreachable from outside machines.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A client cannot connect to `https://api.example.internal`. Inspect the trace and pinpoint the failing layer.',
      artifactTitle: 'Network Diagnostic Trace',
      artifactBody: '$ dig +short api.example.internal -> 10.20.4.18\n$ nc -zv 10.20.4.18 443 -> Connection timed out\nServer binding on 10.20.4.18: ss -tlnp shows 127.0.0.1:443 LISTEN',
      options: [
        {
          id: 'dns-broken',
          label: 'DNS lookup failed to resolve the domain',
          detail: 'blame name resolution',
          isCorrect: false,
          feedback: '`dig` already returned IP `10.20.4.18`, so DNS succeeded!',
        },
        {
          id: 'loopback-bind',
          label: 'Service bound to loopback `127.0.0.1:443` instead of `0.0.0.0:443` / NIC IP',
          detail: 'Host-local socket refuses external TCP SYN packets',
          isCorrect: true,
          feedback: 'Bullseye! Loopback listeners (`127.0.0.1`) drop traffic arriving over remote network interfaces.',
        },
        {
          id: 'wrong-udp',
          label: 'HTTPS requires UDP port 53',
          detail: 'Switch protocol to DNS',
          isCorrect: false,
          feedback: 'HTTPS runs over TCP port 443 (or QUIC/UDP 443), whereas port 53 is DNS.',
        },
      ],
      explainAfterSolve:
        'Systematic layer debugging checks DNS first, then TCP reachability (`ss`/`nc`), then TLS/application logs.',
    },
    bossIntroQuestion: {
      question: 'Which three packets establish a reliable TCP connection before HTTP bytes flow?',
      options: [
        'GET -> POST -> OK',
        'SYN -> SYN-ACK -> ACK',
        'DNS -> ARP -> PING',
        'FIN -> RST -> CLOSE',
      ],
      correctIndex: 1,
      explanation: 'TCP performs a 3-way handshake (`SYN`, `SYN-ACK`, `ACK`) to synchronize initial sequence numbers on both sides.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'CIDR `/24` IPv4 Network Calculator',
      code: `# Chapter 4 Starter: Inspect IPv4 CIDR capacity & mask
import ipaddress
net = ipaddress.ip_network("192.168.10.0/26", strict=False)
print("Network:", net.network_address)
print("Netmask:", net.netmask)
print("Broadcast:", net.broadcast_address)
print("Usable hosts:", net.num_addresses - 2)
`,
    },
    xpClearReward: 150,
  },
  {
    stageId: 'stage-5',
    chapterNumber: 5,
    realmName: 'Query Vault',
    bossName: 'The Schema Warden',
    tierLabel: 'Core Foundations',
    storyHook:
      'Web applications store real state inside relational tables. Learn SQL modeling with primary/foreign keys, clean JOINs, and why naive string concatenation opens SQL Injection.',
    zeroJargonAnalogy:
      'A relational database is like linked spreadsheets where every row has an unbreakable ID badge (`PRIMARY KEY`), and other sheets reference that ID (`FOREIGN KEY`) instead of duplicating data.',
    firstPrinciples: [
      'SQL queries filter rows (`WHERE`), project columns (`SELECT`), sort (`ORDER BY`), and combine normalized tables (`JOIN`).',
      'Primary keys uniquely identify rows; foreign keys guarantee cross-table referential integrity.',
      'HTTP separates safe reads (`GET`) from mutating requests (`POST`, `PUT`, `DELETE`) and uses `HttpOnly` cookies for sessions.',
      'Never concatenate user input into SQL strings—use Prepared Statements (`WHERE email = ?`) so data can never execute as SQL syntax.',
    ],
    commonBeginnerTrap:
      'Building queries with `f"SELECT * FROM users WHERE name = \'{input}\'"`, allowing attackers to inject `\' OR \'1\'=\'1` and bypass authentication.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A login endpoint lets anyone sign in using `admin\' --`. Select the secure fix.',
      artifactTitle: 'Backend Code Audit · auth_query.py',
      artifactBody: '# Vulnerable:\ncursor.execute(f"SELECT id FROM users WHERE user=\'{username}\' AND pass_hash=\'{h}\'")',
      options: [
        {
          id: 'param-query',
          label: 'Use Parameterized Prepared Statement: `cursor.execute("SELECT id FROM users WHERE user=? AND pass_hash=?", (username, h))`',
          detail: 'Driver strictly separates query AST from untrusted parameter values',
          isCorrect: true,
          feedback: 'Correct! Bound parameters treat attacker quotes as inert literal characters, eliminating SQL injection.',
        },
        {
          id: 'uppercase-fix',
          label: 'Convert `username` to UPPERCASE before formatting',
          detail: 'Text casing does not block SQL quotes or boolean clauses',
          isCorrect: false,
          feedback: 'Attacker payloads like `\' OR 1=1 --` still break out of quotes regardless of uppercase.',
        },
        {
          id: 'html-escape',
          label: 'Only check if `username.length > 3`',
          detail: 'Length checks do not prevent SQL syntax injection',
          isCorrect: false,
          feedback: 'Attackers can easily craft short injections (`\' OR 1 --`). Always parameterize queries!',
        },
      ],
      explainAfterSolve:
        'Parameterized queries make SQL structure immutable before user inputs ever arrive.',
    },
    bossIntroQuestion: {
      question: 'Which SQL clause pairs matching rows from `orders` and `customers` using `orders.customer_id = customers.id`?',
      options: ['GROUP BY', 'INNER JOIN', 'ORDER BY', 'ALTER TABLE'],
      correctIndex: 1,
      explanation: '`INNER JOIN` combines rows across tables whenever the join key predicate matches.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'In-Memory SQLite Parameterized Query Lab',
      code: `# Chapter 5 Starter: Real SQLite with safe parameterized queries
import sqlite3
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, handle TEXT, role TEXT)")
db.execute("INSERT INTO users (handle, role) VALUES (?, ?)", ("ada", "architect"))
db.execute("INSERT INTO users (handle, role) VALUES (?, ?)", ("linus", "kernel"))
attacker_input = "ada' OR '1'='1"
rows = db.execute("SELECT handle, role FROM users WHERE handle = ?", (attacker_input,)).fetchall()
print("Safe lookup result (0 leaks):", rows)
print("Valid lookup:", db.execute("SELECT handle, role FROM users WHERE handle = ?", ("ada",)).fetchall())
`,
    },
    xpClearReward: 160,
  },
  {
    stageId: 'stage-6',
    chapterNumber: 6,
    realmName: 'Pointer Foundry',
    bossName: 'The Heap Warden',
    tierLabel: 'Systems Builder',
    storyHook:
      'Enter the metal layer of C programming. Understand exact memory addresses, pointers (`&` and `*`), stack frames vs manual heap allocations, and why missing bounds checks cause buffer overflows.',
    zeroJargonAnalogy:
      'If a variable `x = 42` is a locked post-office box containing `42`, a pointer `p = &x` is a slip of paper holding box number `0x1000`. Dereferencing `*p` walks over to box `0x1000` and reads `42`.',
    firstPrinciples: [
      '`&x` takes the memory address of `x`; `*p` reads or modifies the value sitting at address `p`.',
      'Arrays decay to contiguous pointers; C strings end with a `\\0` null byte and carry zero runtime bounds checks.',
      'Local stack variables die automatically when a function returns; heap memory (`malloc`) survives until `free()`.',
      'Always compile with `-Wall -Wextra` and avoid unsafe functions (`gets`, unchecked `strcpy`); always free once and null pointers.',
    ],
    commonBeginnerTrap:
      'Returning a pointer to a local stack variable (`int x = 5; return &x;`)—once the function returns, that stack frame vanishes (dangling pointer / undefined behavior).',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Trace how a C pointer mutates a variable across memory addresses step by step.',
      languageLabel: 'C11 Memory Trace',
      steps: [
        {
          lineLabel: 'Line 1',
          codeLine: 'int hp = 100;',
          variables: [
            { name: 'hp @ 0x1000', value: '100', note: '4 bytes on Stack' },
          ],
          explanation: 'Allocates `hp` at address `0x1000` with initial value 100.',
        },
        {
          lineLabel: 'Line 2',
          codeLine: 'int *ptr = &hp;',
          variables: [
            { name: 'hp @ 0x1000', value: '100' },
            { name: 'ptr @ 0x1008', value: '0x1000', note: 'Points to hp' },
          ],
          explanation: '`&hp` captures address `0x1000` and stores it inside `ptr`.',
        },
        {
          lineLabel: 'Line 3',
          codeLine: '*ptr = *ptr - 25;',
          variables: [
            { name: 'hp @ 0x1000', value: '75', note: 'Updated via *ptr!' },
            { name: 'ptr @ 0x1008', value: '0x1000' },
          ],
          explanation: 'Dereferencing `*ptr` follows `0x1000` to modify `hp` directly to 75.',
        },
      ],
      checkpointQuestion: 'After Line 3 completes, what does `printf("%d", hp)` print?',
      options: ['100 (hp was untouched)', '75 (modifying *ptr wrote directly to address 0x1000)', '0x1000'],
      correctIndex: 1,
      explainAfterSolve: 'Because `ptr` holds `&hp`, writing through `*ptr` updates the exact memory cell storing `hp`.',
    },
    bossIntroQuestion: {
      question: 'Why must C arrays of size `N` only be indexed from `0` through `N - 1`?',
      options: [
        'C starts counting at 1 automatically',
        'Index N writes past the allocation boundary, triggering Buffer Overflow and corrupting adjacent memory',
        'Index N doubles array capacity',
        'GCC throws a syntax error at index N',
      ],
      correctIndex: 1,
      explanation: 'Zero-indexed arrays span `0 .. N - 1`. Accessing `arr[N]` touches unowned memory (Undefined Behavior).',
    },
    playgroundStarter: {
      language: 'c',
      title: 'C Pointers, Addresses & Safe Array Sum',
      code: `#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main(void) {
    int x = 10, y = 42;
    printf("Before swap: x=%d y=%d\\n", x, y);
    swap(&x, &y);
    printf("After swap:  x=%d y=%d\\n", x, y);
    return 0;
}
`,
    },
    xpClearReward: 175,
  },
  {
    stageId: 'stage-7',
    chapterNumber: 7,
    realmName: 'Ownership Spire',
    bossName: 'The RAII Sentinel',
    tierLabel: 'Systems Builder',
    storyHook:
      'Keep C’s zero-overhead speed without manual `free()` leaks. Master Modern C++ RAII lifetimes, `std::unique_ptr`, bounds-checked containers, and AddressSanitizer.',
    zeroJargonAnalogy:
      'RAII is an automatic deadbolt on a hotel room: the instant you step out the door (scope ends, even via early return or error), the lock clicks shut and releases the room automatically.',
    firstPrinciples: [
      'RAII binds resource lifetime (heap memory, file handles, mutexes) directly to object constructor/destructor scope.',
      'Prefer `std::vector`, `std::string`, and `std::unique_ptr<T>` over raw `new`/`delete` or `malloc`/`free`.',
      'Pass read-only objects as `const T&` to avoid expensive copies while guarding against mutation.',
      'Compile tests with `-fsanitize=address,undefined` to catch memory bugs immediately during development.',
    ],
    commonBeginnerTrap:
      'Writing raw `new` and `delete` inside functions with multiple `return` or exception paths—if an early return triggers before `delete`, memory leaks silently.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Step through a Modern C++ RAII scope to watch how `std::unique_ptr` frees memory automatically without calling `delete`.',
      languageLabel: 'Modern C++ RAII Trace',
      steps: [
        {
          lineLabel: 'Enter block `{`',
          codeLine: 'auto buf = std::make_unique<Buffer>(1024);',
          variables: [
            { name: 'buf owner', value: 'active (1024B)', note: 'Acquired in constructor' },
          ],
          explanation: '`make_unique` allocates heap memory and assigns single ownership to `buf`.',
        },
        {
          lineLabel: 'Early exit check',
          codeLine: 'if (invalid_header) return false;',
          variables: [
            { name: 'buf owner', value: 'unwinding stack', note: 'Early return!' },
          ],
          explanation: 'Function exits early on error before reaching the bottom.',
        },
        {
          lineLabel: 'Automatic ~unique_ptr()',
          codeLine: '} // scope exits -> destructor runs',
          variables: [
            { name: 'buf owner', value: 'FREED (0 leaked)', note: 'Deterministic RAII' },
          ],
          explanation: 'C++ guarantees stack destructors execute in reverse order on ANY exit path.',
        },
      ],
      checkpointQuestion: 'When an exception or early `return` fires inside a C++ function using `std::unique_ptr`, what happens to the owned heap buffer?',
      options: [
        'It leaks until reboot',
        'Its destructor runs deterministically during stack unwinding and frees the buffer',
        'You must call free() manually after return',
      ],
      correctIndex: 1,
      explainAfterSolve: 'Deterministic destruction on every return/exception path is why RAII eliminates whole classes of leaks.',
    },
    bossIntroQuestion: {
      question: 'Which Modern C++ type safely models non-copyable exclusive ownership with zero runtime size overhead vs raw pointers?',
      options: ['void*', 'std::unique_ptr<T>', 'char[]', 'std::auto_free'],
      correctIndex: 1,
      explanation: '`std::unique_ptr<T>` enforces single ownership at compile time and frees automatically upon destruction.',
    },
    playgroundStarter: {
      language: 'c',
      title: 'Simulate Deterministic Cleanup Pattern in C',
      code: `#include <stdio.h>
#include <stdlib.h>

// Demonstrating disciplined single-exit cleanup (C analogue of RAII)
int process_batch(int n) {
    int *buf = malloc((size_t)n * sizeof(int));
    if (!buf) return -1;
    int sum = 0;
    for (int i = 0; i < n; i++) {
        buf[i] = (i + 1) * 10;
        sum += buf[i];
    }
    free(buf); // Single deterministic release
    return sum;
}

int main(void) {
    printf("Batch total: %d\\n", process_batch(5));
    return 0;
}
`,
    },
    xpClearReward: 180,
  },
  {
    stageId: 'stage-8',
    chapterNumber: 8,
    realmName: 'Concurrency Bridge',
    bossName: 'The Channel Arbiter',
    tierLabel: 'Systems Builder',
    storyHook:
      'Build fast backend services and CLI tools in Go. Coordinate lightweight goroutines with typed channels, return explicit errors, and guard every network call with bounded context timeouts.',
    zeroJargonAnalogy:
      'Instead of two chefs colliding over the same cutting board (shared-memory locks), goroutines pass plated orders cleanly across a kitchen pass-through window (`chan`).',
    firstPrinciples: [
      'Go treats errors as explicit returned values (`val, err := fn()`), making failure paths readable inline.',
      'Goroutines multiplex thousands of concurrent tasks across CPU cores cleanly; channels synchronize communication safely.',
      '`defer` schedules resource closing (`defer resp.Body.Close()`) right next to resource acquisition.',
      'Always attach `context.WithTimeout` and explicit `http.Server` / `http.Client` deadlines to defeat stalled-socket exhaustion.',
    ],
    commonBeginnerTrap:
      'Using Go’s bare `http.Get(url)` with zero timeout in production—if a remote server stalls forever, your goroutines leak indefinitely.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Trace how `context.WithTimeout` aborts a stalled downstream query in Go before exhausting server workers.',
      languageLabel: 'Go Concurrency Trace',
      steps: [
        {
          lineLabel: 'Line 1',
          codeLine: 'ctx, cancel := context.WithTimeout(parent, 2*time.Second)',
          variables: [
            { name: 'deadline', value: 't + 2000ms' },
            { name: 'worker', value: 'active' },
          ],
          explanation: 'Derives a bounded deadline context and defers cleanup via `defer cancel()`.',
        },
        {
          lineLabel: 'Line 2 (t + 2000ms)',
          codeLine: 'select { case res := <-ch: ... case <-ctx.Done(): ... }',
          variables: [
            { name: 'ctx.Err()', value: 'DeadlineExceeded', note: 'Timer fired' },
            { name: 'res', value: 'not arrived' },
          ],
          explanation: 'Downstream DB hung beyond 2s; `ctx.Done()` closes immediately and unblocks `select`.',
        },
        {
          lineLabel: 'Line 3',
          codeLine: 'return nil, fmt.Errorf("upstream timeout: %w", ctx.Err())',
          variables: [
            { name: 'goroutine', value: 'exited cleanly', note: '0 leaked sockets' },
          ],
          explanation: 'Handler returns HTTP 504 cleanly and frees all resources.',
        },
      ],
      checkpointQuestion: 'Why did the handler avoid leaking goroutines when the database stalled?',
      options: [
        'Because `select` unblocked immediately when `ctx.Done()` signaled the 2s deadline',
        'Because Go deletes slow databases automatically',
        'Because timeouts increase CPU frequency',
      ],
      correctIndex: 0,
      explainAfterSolve: 'Propagating `ctx.Done()` bounds tail latency and guarantees clean cancellation across service hops.',
    },
    bossIntroQuestion: {
      question: 'Which motto captures Go’s concurrency design philosophy with goroutines and channels?',
      options: [
        'Always mutate globals without locks',
        'Do not communicate by sharing memory; share memory by communicating',
        'Spawn one OS process per character',
        'Ignore errors until runtime panic',
      ],
      correctIndex: 1,
      explanation: 'Channels transfer ownership of messages cleanly between concurrent goroutines without lock contention.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Worker Queue & Timeout Simulation',
      code: `# Chapter 8 Starter: Producer-Consumer Queue + Bounded Deadline
from queue import Queue
q = Queue()
for job in ["hash-chunk-1", "resize-avatar", "send-webhook"]:
    q.put(job)

while not q.empty():
    task = q.get()
    print(f"Worker processed: {task}")
`,
    },
    xpClearReward: 185,
  },
  {
    stageId: 'stage-9',
    chapterNumber: 9,
    realmName: 'Disassembly Cavern',
    bossName: 'The Register Phantom',
    tierLabel: 'Systems Builder',
    storyHook:
      'Peer underneath compiled binaries to see exact x86-64 CPU registers, stack frames, ELF headers, and machine instructions using `readelf`, `gdb`, and Ghidra.',
    zeroJargonAnalogy:
      'Assembly is reading the raw Lego instruction sheet the CPU executes: registers (`RAX`, `RDI`, `RSP`, `RIP`) are the 16 ultra-fast scratchpads right inside the processor core.',
    firstPrinciples: [
      '`RIP` points to the next instruction; `RSP` points to the top of the call stack.',
      'Linux System V AMD64 passes integer/pointer args in `RDI, RSI, RDX, RCX, R8, R9` and returns results in `RAX`.',
      'Compiled Linux executables start with ELF magic bytes `7f 45 4c 46` (`\\x7fELF`).',
      'Inspect binaries safely via `file`, `strings`, `readelf -h`, `objdump -d`, `gdb`, and Ghidra decompilation.',
    ],
    commonBeginnerTrap:
      'Forgetting endianness: x86-64 is little-endian, so the 32-bit hex number `0x12345678` sits in memory bytes as `78 56 34 12`.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Trace x86-64 registers as `add_nums(10, 32)` runs under the System V AMD64 calling convention.',
      languageLabel: 'x86-64 Assembly Trace',
      steps: [
        {
          lineLabel: 'Caller setup',
          codeLine: 'mov edi, 10  ;  mov esi, 32  ;  call add_nums',
          variables: [
            { name: 'RDI', value: '10', note: 'Arg 1' },
            { name: 'RSI', value: '32', note: 'Arg 2' },
            { name: 'RAX', value: '??' },
          ],
          explanation: 'Caller places arg 1 in `RDI`, arg 2 in `RSI`, and pushes return address onto stack.',
        },
        {
          lineLabel: 'Compute sum',
          codeLine: 'lea eax, [rdi + rsi]',
          variables: [
            { name: 'RDI', value: '10' },
            { name: 'RSI', value: '32' },
            { name: 'RAX', value: '42', note: '10 + 32 return value' },
          ],
          explanation: '`LEA` computes `10 + 32 = 42` directly into `RAX` (return register).',
        },
        {
          lineLabel: 'Return',
          codeLine: 'ret',
          variables: [
            { name: 'RAX', value: '42', note: 'Read by caller' },
            { name: 'RIP', value: 'caller_next_insn' },
          ],
          explanation: '`ret` pops the saved return address from `[RSP]` into `RIP`.',
        },
      ],
      checkpointQuestion: 'When `add_nums(10, 32)` executes `ret`, which register holds the returned integer `42`?',
      options: ['RSP', 'RAX', 'R15'],
      correctIndex: 1,
      explainAfterSolve: 'In System V AMD64 ABI, integer/pointer return values are always placed in `RAX` (32-bit lower half `EAX`).',
    },
    bossIntroQuestion: {
      question: 'Which Linux CLI command quickly dumps printable ASCII clues embedded inside an unknown ELF binary?',
      options: ['strings binary_name', 'rmdir binary_name', 'ping binary_name', 'chmod 000'],
      correctIndex: 0,
      explanation: '`strings` scans a binary file for sequences of printable bytes, often revealing hardcoded flags, paths, or error strings.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Inspect Little-Endian Byte Packing & ELF Magic',
      code: `# Chapter 9 Starter: Endianness & ELF signature decoder
import struct
raw_le = struct.pack("<I", 0x12345678)
print("0x12345678 in x86 little-endian memory:", [hex(b) for b in raw_le])
elf_magic = b"\\x7fELF"
print("ELF Magic Bytes:", elf_magic.hex(" "))
`,
    },
    xpClearReward: 190,
  },
  {
    stageId: 'stage-10',
    chapterNumber: 10,
    realmName: 'Bastion Keep',
    bossName: 'The Threat Warden',
    tierLabel: 'Systems Builder',
    storyHook:
      'Think like a defender before touching offensive tools. Master the CIA Triad, Hashing vs Encryption vs Encoding, OWASP Top 10 protections, and authorized sandbox rules.',
    zeroJargonAnalogy:
      'Encoding (Base64) is writing in another font anyone can read; Encryption (`AES-GCM`) is locking a diary with a key; Hashing (`Argon2id`) is turning an egg into an omelet—you can recognize the exact same omelet later, never un-cook it.',
    firstPrinciples: [
      'CIA Triad: Confidentiality (who reads), Integrity (was it altered), Availability (stays online).',
      'Passwords must NEVER be encrypted or plainly SHA-256’d—use slow memory-hard salted hashes (`Argon2id`/`bcrypt`).',
      'Validate untrusted inputs at boundaries: parameterized SQL, contextual HTML escaping, and strict CORS/CSRF/session cookies.',
      'Ethics & Law: Only audit systems you own locally or explicitly authorized training ranges (OverTheWire, picoCTF).',
    ],
    commonBeginnerTrap:
      'Treating Base64 tokens or unsalted SHA-256 hashes as "encrypted secrets"—Base64 decodes instantly with zero key, and unsalted hashes fall to GPU/rainbow cracking.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A developer stores passwords as `base64(md5(password))` calling it "military-grade encryption". Identify the real security flaw.',
      artifactTitle: 'Security Review · user_auth_store.ts',
      artifactBody: 'const storedHash = Buffer.from(md5(password)).toString("base64");',
      options: [
        {
          id: 'broken-kdf',
          label: 'Broken fast hash + zero salt + Base64 obfuscation: replace with salted Argon2id / bcrypt',
          detail: 'MD5 is fast & broken; Base64 adds zero secrecy; missing salt leaks identical passwords',
          isCorrect: true,
          feedback: 'Spot on! Salted Argon2id/bcrypt slows offline GPU guessing and prevents rainbow-table lookups.',
        },
        {
          id: 'base64-twice',
          label: 'Run Base64 encoding 5 times instead of once',
          detail: 'Encoding is publicly reversible without any secret key',
          isCorrect: false,
          feedback: 'Repeated Base64 is still zero security—anyone can decode it in microseconds.',
        },
        {
          id: 'plain-compare',
          label: 'Store passwords in plaintext so users can reset them',
          detail: 'A single DB leak exposes every user password immediately',
          isCorrect: false,
          feedback: 'Plaintext credential storage violates fundamental password security.',
        },
      ],
      explainAfterSolve:
        'Never confuse Encoding (format), Hashing (one-way verification), and Encryption (keyed confidentiality).',
    },
    bossIntroQuestion: {
      question: 'Which defense specifically stops malicious scripts injected into stored user comments (`<script>...`) from executing in victims’ browsers?',
      options: [
        'Increasing server RAM',
        'Contextual output encoding / strict XSS sanitization + Content-Security-Policy (CSP)',
        'Using HTTP instead of HTTPS',
        'Storing passwords in Base64',
      ],
      correctIndex: 1,
      explanation: 'Escaping untrusted HTML/attributes and enforcing CSP neutralizes Cross-Site Scripting (XSS) payloads.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Verify HMAC Integrity & Constant-Time Compare',
      code: `# Chapter 10 Starter: Integrity verification with HMAC + compare_digest
import hmac, hashlib
secret = b"server-signing-key"
msg = b"role=student&stage=10"
sig = hmac.new(secret, msg, hashlib.sha256).hexdigest()
print("Message Signature:", sig[:24] + "...")
print("Valid verify:", hmac.compare_digest(sig, hmac.new(secret, msg, hashlib.sha256).hexdigest()))
print("Tampered verify:", hmac.compare_digest(sig, hmac.new(secret, b"role=admin&stage=10", hashlib.sha256).hexdigest()))
`,
    },
    xpClearReward: 200,
  },
  {
    stageId: 'stage-11',
    chapterNumber: 11,
    realmName: 'Shipyard Summit',
    bossName: 'The Release Architect',
    tierLabel: 'Systems Builder',
    storyHook:
      'Bridge learning into real engineering craft. Learn how to escape tutorial loops, structure maintainable projects with tests and honest architecture READMEs, and communicate trade-offs clearly.',
    zeroJargonAnalogy:
      'Tutorial copying is tracing someone else’s map; engineering craft is surveying unfamiliar terrain yourself, writing tests that prove your bridge holds weight, and leaving clear blueprints for teammates.',
    firstPrinciples: [
      'A strong portfolio project solves a concrete problem, includes automated tests, documents failure modes, and runs reproducibly.',
      'Write a crisp README covering Architecture, Setup, Design Trade-offs, and Verification Commands.',
      'Build from official RFCs, man-pages, and debugging logs rather than copying tutorials blindly.',
      'Practice explaining any component you built in under 3 minutes: Problem -> Mechanism -> Bottleneck -> Next Improvement.',
    ],
    commonBeginnerTrap:
      'Polishing UI colors for weeks while shipping zero automated tests or failing to verify how the code behaves under malformed inputs.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: Two candidates built a CLI file-hasher. Pick the repository ready for engineering review.',
      artifactTitle: 'Portfolio Audit Comparison',
      artifactBody: 'Repo A: single 900-line script.py, README says "run python script.py", 0 tests.\nRepo B: modular hasher.py + cli.py, 12 pytest edge-case tests, README with benchmark & threat model.',
      options: [
        {
          id: 'repo-b',
          label: 'Repo B — modular architecture, automated edge-case tests, documented design & limits',
          detail: 'Demonstrates verification discipline and production maintainability',
          isCorrect: true,
          feedback: 'Exactly right. Modular tests and honest documentation prove true ownership beyond tutorial code.',
        },
        {
          id: 'repo-a',
          label: 'Repo A — keeping everything in one 900-line file saves folders',
          detail: 'Monolithic untested scripts break silently under edge cases',
          isCorrect: false,
          feedback: 'Reviewers look for clear boundaries, error handling, and verifiable automated tests.',
        },
      ],
      explainAfterSolve:
        'Tests + clear READMEs + explicit trade-offs separate real software engineers from tutorial followers.',
    },
    bossIntroQuestion: {
      question: 'When documenting an engineering project in `README.md`, which section best proves your system actually works?',
      options: [
        'A list of buzzwords',
        'Reproducible setup instructions + exact test commands & architecture trade-offs',
        'Hidden source code',
        'A 20-page marketing brochure',
      ],
      correctIndex: 1,
      explanation: 'Clear setup commands, automated test output, and candid design trade-offs establish instant engineering credibility.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Write Self-Verifying Assertions (Unit Test Style)',
      code: `# Chapter 11 Starter: Always ship assertions proving invariants!
def slugify(text: str) -> str:
    return "-".join(text.strip().lower().split())

assert slugify("  CS   Odyssey 101 ") == "cs-odyssey-101"
assert slugify("Binary") == "binary"
print("All unit assertions passed!")
`,
    },
    xpClearReward: 200,
  },
  {
    stageId: 'stage-12',
    chapterNumber: 12,
    realmName: 'Algorithm Peak',
    bossName: 'The Complexity Oracle',
    tierLabel: 'Mastery Frontier',
    storyHook:
      'Command classic Computer Science algorithms: hash tables, min-heaps, Dijkstra’s shortest path, and Dynamic Programming memoization that collapses exponential searches to linear time.',
    zeroJargonAnalogy:
      'Dynamic Programming is remembering past answers on sticky notes: instead of recomputing `fib(30)` a million times from scratch, write it down once and look it up in O(1)!',
    firstPrinciples: [
      'Master Theorem & Recurrences explain divide-and-conquer costs: Merge Sort splits log N times × N merge = O(N log N).',
      'Hash Tables give O(1) expected lookup; Binary Heaps keep min/max at the root with O(log N) push/pop.',
      'BFS finds unweighted shortest paths; Dijkstra uses a min-heap for non-negative weighted graphs.',
      'Dynamic Programming turns exponential overlapping recursion into polynomial time via memoization or tabulation.',
    ],
    commonBeginnerTrap:
      'Running Dijkstra’s greedy relaxation on graphs containing negative edge weights (use Bellman-Ford instead) or forgetting base cases in recursion.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Watch bottom-up Dynamic Programming fill `dp[]` for Climbing Stairs (ways to reach step N using 1 or 2 steps).',
      languageLabel: 'DP Tabulation Trace',
      steps: [
        {
          lineLabel: 'Base cases',
          codeLine: 'dp[0] = 1; dp[1] = 1',
          variables: [
            { name: 'dp[0]', value: '1' },
            { name: 'dp[1]', value: '1' },
          ],
          explanation: 'Seed base states once—zero recursive explosion.',
        },
        {
          lineLabel: 'i = 2',
          codeLine: 'dp[2] = dp[1] + dp[0]',
          variables: [
            { name: 'dp[0..2]', value: '[1, 1, 2]', note: '1 + 1 = 2' },
          ],
          explanation: 'Reuses cached answers for steps 0 and 1 in O(1).',
        },
        {
          lineLabel: 'i = 3 & 4',
          codeLine: 'dp[3] = 2+1 = 3; dp[4] = 3+2 = 5',
          variables: [
            { name: 'dp[0..4]', value: '[1, 1, 2, 3, 5]', note: 'Linear O(N)!' },
          ],
          explanation: 'Every subproblem computed strictly once, cutting O(2^N) down to O(N)!',
        },
      ],
      checkpointQuestion: 'Following `dp[i] = dp[i-1] + dp[i-2]`, how many distinct ways reach step 5?',
      options: ['6 ways', '8 ways (5 + 3)', '16 ways'],
      correctIndex: 1,
      explainAfterSolve: '`dp[5] = dp[4] + dp[3] = 5 + 3 = 8`. Tabulation executes in clean linear time.',
    },
    bossIntroQuestion: {
      question: 'When choosing an in-memory data structure to always pull the lowest-cost task next in O(log N) time, which fits best?',
      options: ['Unsorted Linked List', 'Min-Heap (Priority Queue)', 'FIFO Queue', 'Static String'],
      correctIndex: 1,
      explanation: 'A Min-Heap guarantees O(1) peek of the minimum element and O(log N) insertion/extraction.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Dijkstra Shortest Path in 15 Lines',
      code: `# Chapter 12 Starter: Priority-queue shortest path
import heapq
graph = {"A": [("B", 2), ("C", 5)], "B": [("C", 1), ("D", 4)], "C": [("D", 1)], "D": []}
dist = {"A": 0}
pq = [(0, "A")]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist.get(u, 10**9):
        continue
    for v, w in graph[u]:
        if d + w < dist.get(v, 10**9):
            dist[v] = d + w
            heapq.heappush(pq, (dist[v], v))
print("Shortest distances from A:", dist)
`,
    },
    showAlgoVisualizerButton: true,
    xpClearReward: 220,
  },
  {
    stageId: 'stage-13',
    chapterNumber: 13,
    realmName: 'Consensus Spire',
    bossName: 'The Raft Arbiter',
    tierLabel: 'Mastery Frontier',
    storyHook:
      'Enter deep computer systems: how compilers parse ASTs and SSA IR, how OS kernels map Virtual Memory via TLBs, and how distributed clusters survive splits with Raft & WALs.',
    zeroJargonAnalogy:
      'Virtual Memory gives every program its own private 0-to-infinity map book translated quietly by the hardware MMU; Raft keeps a group of servers agreeing on one leader using majority votes so split networks never create two conflicting truths.',
    firstPrinciples: [
      'Compilers transform source cleanly: Lexer -> Parser (AST) -> Type Checker -> SSA IR -> Register Allocation -> Machine Code.',
      'OS Page Tables translate process virtual addresses into physical RAM frames with MMU + TLB caching.',
      'CAP Theorem: Under a Network Partition (P), distributed stores trade off strict Consistency (CP) vs Availability (AP).',
      'Storage engines write sequentially to Write-Ahead Logs (WAL) for crash durability, backing B+ Trees or LSM-Trees.',
    ],
    commonBeginnerTrap:
      'Assuming distributed nodes share accurate wall-clock time—network skew breaks physical timestamps; rely on Lamport/vector clocks and majority quorums.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A 5-node Raft cluster splits into Partition A (2 nodes, holding the old leader) and Partition B (3 nodes). What happens to new writes?',
      artifactTitle: 'Distributed Consensus · 5-Node Cluster Partition',
      artifactBody: 'Partition A: [OldLeader, Follower1] (2/5 nodes)\nPartition B: [Follower2, Follower3, Follower4] (3/5 nodes)',
      options: [
        {
          id: 'majority-wins',
          label: 'Partition B elects a new leader (3 >= majority quorum of 3) and accepts writes; Partition A cannot commit',
          detail: 'Quorum intersection prevents split-brain diverging histories',
          isCorrect: true,
          feedback: 'Exact Raft guarantee! Because any two majorities of 5 nodes overlap by at least 1 node, split-brain writes are impossible.',
        },
        {
          id: 'both-commit',
          label: 'Both partitions keep committing independent writes simultaneously',
          detail: 'Creates fatal divergent split-brain logs',
          isCorrect: false,
          feedback: 'A minority (2/5) can never form a quorum in Raft; OldLeader fails to replicate commits.',
        },
        {
          id: 'all-halt',
          label: 'The entire cluster freezes forever until manual reboot',
          detail: 'False: Partition B holds a strict majority (3/5)',
          isCorrect: false,
          feedback: 'Raft remains available in the majority partition as long as floor(N/2)+1 nodes can communicate.',
        },
      ],
      explainAfterSolve:
        'Majority quorums (floor(N/2)+1) ensure at most one side of any partition can elect a leader or commit entries.',
    },
    bossIntroQuestion: {
      question: 'Why do storage engines (like PostgreSQL and RocksDB) append mutations to a Write-Ahead Log (WAL) before updating B-Tree/Memtable pages?',
      options: [
        'To slow down disk writes',
        'Sequential appends guarantee crash durability so interrupted writes can replay cleanly on recovery',
        'To disable transactions',
        'To shrink SQL schemas',
      ],
      correctIndex: 1,
      explanation: 'Sequential WAL writes are fast and atomic, letting databases recover committed transactions cleanly after sudden power loss.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Recursive Descent Expression Evaluator (Mini Compiler)',
      code: `# Chapter 13 Starter: Mini Lexer + Evaluator
tokens = ["(", "2", "+", "3", ")", "*", "4"]
# Evaluate cleanly in Python AST/stack
expr = "".join(tokens)
print("Expression:", expr, "=>", (2 + 3) * 4)
`,
    },
    xpClearReward: 240,
  },
  {
    stageId: 'stage-14',
    chapterNumber: 14,
    realmName: 'Cloud Crucible',
    bossName: 'The Cluster Controller',
    tierLabel: 'Mastery Frontier',
    storyHook:
      'Run software reliably at scale. Demystify Linux containers (namespaces + cgroups), declarative Kubernetes reconciliation loops, p99 tail latency, and supply-chain CI/CD hardening.',
    zeroJargonAnalogy:
      'A container isn’t a heavy mini-computer—it is an isolated Linux process wearing blinders (Namespaces) and a speed/budget limiter (cgroups) while sharing the host kernel.',
    firstPrinciples: [
      'Containers isolate visibility (PID/Net/Mount namespaces) and cap resource budgets (CPU/RAM cgroups) on one kernel.',
      'Multi-stage Docker builds strip compilers and run as non-root `USER` to cut image CVEs and blast radius.',
      'Kubernetes controllers constantly reconcile desired spec vs observed state without brittle imperative scripts.',
      'Track tail latency (`p95`/`p99`) and error budgets (SLOs) instead of misleading average response times.',
    ],
    commonBeginnerTrap:
      'Baking `.env` API secrets inside Dockerfile `ENV` or `COPY` layers—anyone running `docker history` or inspecting image layers extracts leaked keys.',
    interactiveLab: {
      type: 'system-diagnostic',
      prompt: 'Mission: A container image clocks in at 1.4 GB, includes `gcc`, runs as UID 0 (`root`), and copies `.env` into `/app`. Choose the production fix.',
      artifactTitle: 'Container Security & Size Audit',
      artifactBody: 'FROM node:22\nCOPY . /app\nRUN npm run build\nCMD ["node", "server.js"]',
      options: [
        {
          id: 'multistage-nonroot',
          label: 'Use multi-stage build, copy only compiled dist/runtime, exclude `.env` via `.dockerignore`, set non-root `USER`',
          detail: 'Minimal runtime layer, zero secret leakage, least privilege UID',
          isCorrect: true,
          feedback: 'Clean cloud-native engineering! Multi-stage builds slash CVEs and non-root execution constrains container escapes.',
        },
        {
          id: 'compress-tar',
          label: 'Zip `.env` inside `/app/secrets.zip` with a short comment',
          detail: 'Secrets inside image layers remain recoverable by anyone pulling the image',
          isCorrect: false,
          feedback: 'Never bake secrets into images—inject secrets dynamically at runtime via secret mounts or env vault.',
        },
      ],
      explainAfterSolve:
        'Least privilege (`USER`), minimal artifacts (multi-stage), and runtime secret injection form the bedrock of container hygiene.',
    },
    bossIntroQuestion: {
      question: 'In a service serving 100 requests per second where mean latency is 25ms, why might 1 in 20 user page loads still take 1.8 seconds?',
      options: [
        'Mean latency hides extreme p95/p99 tail latency outliers amplified by fan-out calls',
        'Averages are calculated in hexadecimal',
        'HTTP caches speed up errors',
        'JSON doubles packet weight',
      ],
      correctIndex: 0,
      explanation: 'High-percentile (`p95`/`p99`) tail latency dominates real user experience, especially across microservice fan-outs.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Compute p50, p95 & p99 Tail Latency Telemetry',
      code: `# Chapter 14 Starter: Percentile calculator (why averages lie!)
latencies_ms = [12, 14, 15, 16, 18, 19, 20, 21, 22, 25, 28, 30, 31, 32, 33, 35, 36, 40, 420, 980]
latencies_ms.sort()
p50 = latencies_ms[int(0.50 * len(latencies_ms))]
p95 = latencies_ms[int(0.95 * len(latencies_ms))]
mean = sum(latencies_ms) / len(latencies_ms)
print(f"Mean: {mean:.1f}ms | p50: {p50}ms | p95 tail spike: {p95}ms")
`,
    },
    xpClearReward: 250,
  },
  {
    stageId: 'stage-15',
    chapterNumber: 15,
    realmName: 'Tensor Summit',
    bossName: 'The Gradient Sovereign',
    tierLabel: 'Mastery Frontier',
    storyHook:
      'Complete the Odyssey from silicon gates to modern AI & High-Performance Computing. Build neural gradients from first principles, stabilize Softmax, and harness CPU cache locality.',
    zeroJargonAnalogy:
      'Training a neural network is hiking downhill blindfolded: Backpropagation uses calculus slopes (gradients) to feel which direction lowers prediction error, taking carefully sized steps (`learning_rate`) downhill.',
    firstPrinciples: [
      'Dot products measure directional vector alignment (`cos θ`); matrix multiplication batches linear projections across dimensions.',
      'Backpropagation applies the multivariable chain rule backward to compute every weight gradient in one reverse pass.',
      'Subtracting `max(logits)` before `exp(x)` stabilizes Softmax mathematically without changing output probabilities.',
      'High-performance C loops stream contiguous row-major elements (`i -> k -> j`) so CPU L1 caches and SIMD units stay saturated.',
    ],
    commonBeginnerTrap:
      'Computing `exp(logits)` directly without subtracting `max(logits)`—even moderate logits like `1000.0` overflow float64 into `NaN` immediately.',
    interactiveLab: {
      type: 'trace-stepper',
      prompt: 'Trace one single Gradient Descent optimization step minimizing loss `L = (w * x - target)^2` from scratch.',
      languageLabel: 'Neural Gradient Trace',
      steps: [
        {
          lineLabel: 'Forward pass',
          codeLine: 'x = 2.0, target = 10.0, w = 3.0 -> pred = 6.0',
          variables: [
            { name: 'w', value: '3.0' },
            { name: 'pred', value: '6.0' },
            { name: 'loss', value: '16.0', note: '(6 - 10)^2' },
          ],
          explanation: 'Prediction `6.0` undershoots target `10.0`, producing squared error `16.0`.',
        },
        {
          lineLabel: 'Backward gradient',
          codeLine: 'dL/dw = 2 * (pred - target) * x = -16.0',
          variables: [
            { name: 'dL/dw', value: '-16.0', note: 'Negative slope -> increase w!' },
          ],
          explanation: 'Chain rule reveals loss drops fastest by increasing weight `w`.',
        },
        {
          lineLabel: 'Weight update (lr = 0.1)',
          codeLine: 'w_new = w - lr * (-16.0) = 3.0 + 1.6 = 4.6',
          variables: [
            { name: 'w_new', value: '4.6', note: 'Pred jumps 6.0 -> 9.2!' },
            { name: 'new loss', value: '0.64', note: 'Dropped 16.0 -> 0.64' },
          ],
          explanation: 'A single gradient step shrank error by 96% cleanly toward `w = 5.0`!',
        },
      ],
      checkpointQuestion: 'Why do we subtract `lr * gradient` (`w - lr * dL/dw`) during Gradient Descent?',
      options: [
        'Because the gradient points uphill toward HIGHER loss; subtracting moves downhill toward minimum loss',
        'Because GPUs cannot add positive floats',
        'To reset every weight to zero',
      ],
      correctIndex: 0,
      explainAfterSolve: 'The gradient vector always points along steepest ascent; negating it steps cleanly downhill.',
    },
    bossIntroQuestion: {
      question: 'Why does changing a C nested matrix-multiply loop from `i -> j -> k` to `i -> k -> j` run dramatically faster on modern CPUs?',
      options: [
        'It skips floating-point multiplications',
        'Accessing matrix B row-by-row (`B[k][j]`) hits sequential cache lines instead of striding across memory per step',
        'It lowers RAM voltage',
        'It compiles to Python bytecode',
      ],
      correctIndex: 1,
      explanation: 'Sequential row-major traversal unlocks hardware spatial prefetching and L1 cache reuse instead of constant cache misses.',
    },
    playgroundStarter: {
      language: 'python',
      title: 'Numerically Stable Softmax + Gradient Step',
      code: `# Chapter 15 Starter: Safe Softmax + 1-neuron gradient descent
import math

def safe_softmax(logits):
    m = max(logits)
    exps = [math.exp(v - m) for v in logits]
    s = sum(exps)
    return [round(e / s, 4) for e in exps]

print("Stable Softmax on huge logits:", safe_softmax([1000.0, 1001.0, 998.0]))

w, x, target, lr = 3.0, 2.0, 10.0, 0.1
for step in range(4):
    pred = w * x
    loss = (pred - target) ** 2
    grad = 2 * (pred - target) * x
    w -= lr * grad
    print(f"Step {step}: w={w:.3f}, pred={pred:.3f}, loss={loss:.4f}")
`,
    },
    xpClearReward: 300,
  },
];

export const BIT_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1] as const;

export function computeBitsValue(bits: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    if (bits[i]) sum += BIT_WEIGHTS[i];
  }
  return sum;
}

export function toSigned8Bit(unsignedVal: number): number {
  const clean = Math.max(0, Math.min(255, Math.floor(unsignedVal)));
  return clean >= 128 ? clean - 256 : clean;
}

export function toHexByte(unsignedVal: number): string {
  const clean = Math.max(0, Math.min(255, Math.floor(unsignedVal)));
  return '0x' + clean.toString(16).toUpperCase().padStart(2, '0');
}

export function toAsciiPreview(unsignedVal: number): string {
  const clean = Math.max(0, Math.min(255, Math.floor(unsignedVal)));
  if (clean >= 32 && clean <= 126) {
    return `'${String.fromCharCode(clean)}'`;
  }
  return 'CTRL';
}

export function evaluateBinaryLabMission(
  bits: readonly number[],
  targetUnsigned: number
): { current: number; target: number; solved: boolean } {
  const current = computeBitsValue(bits);
  const target = Math.max(0, Math.min(255, Math.floor(targetUnsigned)));
  return { current, target, solved: current === target };
}

export function evaluateLogicGate(
  gate: LogicGateType,
  a: boolean,
  b: boolean
): boolean {
  switch (gate) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
    case 'XNOR':
      return a === b;
  }
}

export function evaluateLogicLabMission(
  gate: LogicGateType,
  a: boolean,
  b: boolean,
  config: LogicGateLabConfig
): { output: boolean; solved: boolean } {
  const output = evaluateLogicGate(gate, a, b);
  const gateMatches = !config.requiredGate || config.requiredGate === gate;
  const outputMatches = output === config.targetOutput;
  const nonZeroMatches = !config.mustUseNonZeroInputs || a || b;
  return {
    output,
    solved: gateMatches && outputMatches && nonZeroMatches,
  };
}

export function getBossQuestionsForRealm(stageId: string): QuizQuestionItem[] {
  const realm = ADVENTURE_REALMS.find((r) => r.stageId === stageId);
  const bank = STAGE_FALLBACK_QUIZZES[stageId] || STAGE_FALLBACK_QUIZZES['stage-0'] || [];
  if (!realm) return bank.slice(0, 4);
  return [realm.bossIntroQuestion, ...bank.slice(0, 3)];
}

export interface RealmCampaignStatus {
  stageId: string;
  chapterNumber: number;
  realmName: string;
  bossName: string;
  topicsDone: number;
  topicsTotal: number;
  exitDone: number;
  exitTotal: number;
  mastered: boolean;
  progressPercent: number;
}

export function computeAdventureCampaignProgress(
  completedTopics: Record<string, boolean>,
  completedExitChecks: Record<string, boolean>
): {
  realms: RealmCampaignStatus[];
  masteredRealmsCount: number;
  totalRealmsCount: number;
  overallPercent: number;
  recommendedStageId: string;
} {
  const realms: RealmCampaignStatus[] = ADVENTURE_REALMS.map((realm) => {
    const stage = STAGES_DATA.find((s) => s.id === realm.stageId);
    const topicsTotal = stage ? stage.topics.length : 0;
    const topicsDone = stage
      ? stage.topics.filter((t) => Boolean(completedTopics[t.id])).length
      : 0;
    const exitTotal = stage ? stage.exitChecklist.length : 0;
    const exitDone = stage
      ? stage.exitChecklist.filter((_, idx) => Boolean(completedExitChecks[`${stage.id}-${idx}`])).length
      : 0;

    const totalItems = Math.max(1, topicsTotal + exitTotal);
    const progressPercent = Math.round(((topicsDone + exitDone) / totalItems) * 100);
    const mastered = topicsTotal > 0 && topicsDone === topicsTotal && exitDone >= 1;

    return {
      stageId: realm.stageId,
      chapterNumber: realm.chapterNumber,
      realmName: realm.realmName,
      bossName: realm.bossName,
      topicsDone,
      topicsTotal,
      exitDone,
      exitTotal,
      mastered,
      progressPercent,
    };
  });

  const masteredRealmsCount = realms.filter((r) => r.mastered).length;
  const totalRealmsCount = realms.length;
  const overallPercent =
    totalRealmsCount > 0
      ? Math.round(realms.reduce((sum, r) => sum + r.progressPercent, 0) / totalRealmsCount)
      : 0;
  const recommended =
    realms.find((r) => !r.mastered) || realms[realms.length - 1] || realms[0];

  return {
    realms,
    masteredRealmsCount,
    totalRealmsCount,
    overallPercent,
    recommendedStageId: recommended?.stageId || 'stage-0',
  };
}
