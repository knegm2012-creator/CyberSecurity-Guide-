import { STAGES_DATA } from './curriculum-data.ts';
import { CURATED_CS_SOURCES } from './sources-catalog.ts';

export interface SearchSourceCitation {
  title: string;
  uri: string;
}

export interface QuizQuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Verified offline question banks covering all 16 stages (stage-0 through stage-15)
 * so quizzes remain 100% functional without external network connectivity or API keys.
 */
export const STAGE_FALLBACK_QUIZZES: Record<string, QuizQuestionItem[]> = {
  'stage-0': [
    {
      question: 'What is the smallest unit of digital information that a computer can store?',
      options: ['A byte', 'A bit (0 or 1)', 'A megabyte', 'A pixel'],
      correctIndex: 1,
      explanation: 'A bit (binary digit) is the fundamental atomic unit of computing, representing either 0 (off) or 1 (on).',
    },
    {
      question: 'How many bits are contained in a single byte?',
      options: ['4 bits', '8 bits', '16 bits', '64 bits'],
      correctIndex: 1,
      explanation: 'There are 8 bits in 1 byte, which allows representing values from 0 to 255 (256 distinct patterns).',
    },
    {
      question: 'What is the primary physical function of a transistor in a CPU?',
      options: ['To cool the computer down', 'An electronic switch that turns electricity on or off', 'To store files permanently when power is off', 'To display pixels on the screen'],
      correctIndex: 1,
      explanation: 'Transistors are microscopic semiconductor switches that control electrical current, enabling logic gates (AND, OR, NOT).',
    },
    {
      question: 'What happens to data stored in volatile Random Access Memory (RAM) when you turn off the computer?',
      options: ['It is automatically compressed and saved', 'It is permanently erased immediately', 'It is sent to the internet', 'It stays frozen in place for 30 days'],
      correctIndex: 1,
      explanation: 'RAM is volatile storage; without continuous electrical power, capacitor/latch states fade and data is lost immediately.',
    },
    {
      question: 'Which component is known as the "brain" of the computer that executes software instructions?',
      options: ['The SSD', 'The Central Processing Unit (CPU)', 'The GPU fan', 'The power supply unit (PSU)'],
      correctIndex: 1,
      explanation: 'The CPU performs the fetch-decode-execute cycle to run compiled machine instructions.',
    },
  ],
  'stage-1': [
    {
      question: 'In Python, what is the data type of the expression `[1, 2, 3]`?',
      options: ['Tuple', 'Set', 'List', 'Dictionary'],
      correctIndex: 2,
      explanation: 'Square brackets `[...]` declare an ordered, mutable sequence called a List in Python.',
    },
    {
      question: 'Which loop is best suited when iterating directly over items in a Python sequence or range?',
      options: ['while loop', 'for loop (e.g. for item in items)', 'loop-until loop', 'goto loop'],
      correctIndex: 1,
      explanation: 'A `for` loop iterates cleanly across sequences or ranges: `for i in range(10):`.',
    },
    {
      question: 'What keyword is used to define a reusable function in Python?',
      options: ['func', 'def', 'function', 'fn'],
      correctIndex: 1,
      explanation: 'Python uses `def` followed by the function identifier and parameter list.',
    },
    {
      question: 'What does `counts.get(key, 0)` return on a Python dictionary if `key` is missing?',
      options: ['Raises KeyError', 'Returns 0 without mutating the dictionary', 'Deletes all keys', 'Returns -1'],
      correctIndex: 1,
      explanation: '`dict.get(key, default)` safely returns the fallback default when the key is absent instead of crashing.',
    },
    {
      question: 'What exception occurs when Python calls `input()` on an empty stdin stream or hits unbalanced spaces?',
      options: ['NullPointerException', 'EOFError (empty stdin) or IndentationError (spacing mismatch)', 'SegFault 11', 'DivisionError'],
      correctIndex: 1,
      explanation: 'Python raises `EOFError` when stdin ends prematurely and `IndentationError` when block spacing is inconsistent.',
    },
  ],
  'stage-2': [
    {
      question: 'Which Boolean logic gate outputs `1` if and only if BOTH inputs are `1`?',
      options: ['XOR', 'OR', 'AND', 'NOR'],
      correctIndex: 2,
      explanation: 'The AND gate yields 1 exclusively when both inputs are 1; XOR yields 1 only when inputs differ.',
    },
    {
      question: 'In a Half Adder circuit combining two 1-bit inputs A and B, which gates compute the Sum and Carry bits?',
      options: ['Sum = A AND B, Carry = A OR B', 'Sum = A XOR B, Carry = A AND B', 'Sum = NOT A, Carry = B', 'Sum = A OR B, Carry = A XOR B'],
      correctIndex: 1,
      explanation: 'Adding binary bits produces sum `A ^ B` and carry-out `A & B`. Chaining Full Adders builds 64-bit ALUs.',
    },
    {
      question: 'What three continuous steps make up the classic CPU instruction cycle?',
      options: ['Compile, Link, Run', 'Fetch, Decode, Execute', 'Read, Compress, Flush', 'Boot, Poll, Sleep'],
      correctIndex: 1,
      explanation: 'The CPU fetches an instruction pointed to by RIP/PC, decodes its opcode/operands, and executes it inside the ALU.',
    },
    {
      question: 'Why does accessing L1 CPU cache vastly outperform reading main DRAM or an NVMe SSD?',
      options: ['L1 uses fiber cables', 'L1 SRAM sits physically next to the ALU cores with ~1 ns latency vs ~80 ns DRAM', 'DRAM stores compressed strings', 'SSDs use decimal digits'],
      correctIndex: 1,
      explanation: 'Memory hierarchy trades cost per byte for physical proximity: registers < L1/L2/L3 SRAM cache < DRAM < NVMe SSD.',
    },
    {
      question: 'What distinguishes `O(log N)` binary search from `O(N)` linear scan as data scales to 1,000,000 items?',
      options: ['Binary search checks ~20 elements by halving sorted search space vs up to 1,000,000', 'Linear scan is always faster', 'Both do identical steps', 'Binary search works on unsorted arrays'],
      correctIndex: 0,
      explanation: 'Halving the search space each comparison grows logarithmically: log2(1,000,000) ≈ 20 steps.',
    },
  ],
  'stage-3': [
    {
      question: 'In the Linux terminal, which command displays the full absolute path of your current working directory?',
      options: ['cd', 'pwd', 'ls', 'whoami'],
      correctIndex: 1,
      explanation: '`pwd` stands for "Print Working Directory" and outputs your exact path (e.g. /home/bandit0).',
    },
    {
      question: 'How do you inspect all files including hidden dotfiles with detailed permissions in Linux?',
      options: ['ls -la', 'dir /all', 'cat *', 'find . -hidden'],
      correctIndex: 0,
      explanation: '`-a` reveals hidden dotfiles beginning with `.`, and `-l` displays permissions, ownership, size, and timestamps.',
    },
    {
      question: 'What does the pipe operator `|` do between two shell commands?',
      options: ['Deletes the first command', 'Connects stdout of the left command directly into stdin of the right command', 'Runs commands once a week', 'Converts binaries to ZIP'],
      correctIndex: 1,
      explanation: 'Pipelines compose small UNIX filters (`cat auth.log | grep Failed | sort | uniq -c`) in memory.',
    },
    {
      question: 'Which Git command stages modified files into the index before creating a commit snapshot?',
      options: ['git push', 'git add <file>', 'git clone', 'git stash'],
      correctIndex: 1,
      explanation: '`git add` records exact snapshot changes in the staging index for the next `git commit`.',
    },
    {
      question: 'What does an operating system kernel guarantee between isolated user-space processes?',
      options: ['Shared raw pointers by default', 'Virtual memory isolation, preemptive scheduling, and mediated system calls', 'Direct physical disk Sector writes by any script', 'Single-threaded BIOS polling'],
      correctIndex: 1,
      explanation: 'The kernel isolates per-process virtual address spaces, schedules CPU time slices, and arbitrates hardware via syscalls.',
    },
  ],
  'stage-4': [
    {
      question: 'What is the primary role of the Domain Name System (DNS)?',
      options: ['To encrypt credit card numbers', 'To resolve human-readable domain names into routable IP addresses', 'To boost CPU clock frequency', 'To compile C files'],
      correctIndex: 1,
      explanation: 'DNS acts as the distributed directory mapping names like example.org to IPv4 (A) or IPv6 (AAAA) addresses.',
    },
    {
      question: 'Which transport protocol guarantees ordered, reliable byte-stream delivery via SYN / SYN-ACK / ACK handshakes?',
      options: ['UDP', 'TCP', 'ICMP', 'ARP'],
      correctIndex: 1,
      explanation: 'TCP uses three-way handshakes, sequence numbers, checksums, and retransmissions for reliable ordered streams.',
    },
    {
      question: 'Which well-known port is standard for TLS-encrypted web traffic (HTTPS)?',
      options: ['Port 80', 'Port 22', 'Port 443', 'Port 53'],
      correctIndex: 2,
      explanation: 'Port 443 carries HTTPS; 80 is cleartext HTTP, 22 is SSH, and 53 is DNS.',
    },
    {
      question: 'What is the IPv4 loopback address referring exclusively to the local machine?',
      options: ['192.168.1.1', '127.0.0.1 (localhost)', '10.0.0.1', '8.8.8.8'],
      correctIndex: 1,
      explanation: '127.0.0.1 (and ::1 in IPv6) loops packets through the OS kernel network stack without leaving the host.',
    },
    {
      question: 'Which protocol maps an IPv4 address to a physical Layer 2 MAC address on a local Ethernet LAN?',
      options: ['ARP (Address Resolution Protocol)', 'SMTP', 'SSH', 'SNMP'],
      correctIndex: 0,
      explanation: 'ARP resolves LAN IPv4 addresses into 48-bit Ethernet MAC hardware addresses.',
    },
  ],
  'stage-5': [
    {
      question: 'In SQL, which clause filters rows matching a boolean predicate before projection?',
      options: ['ORDER BY', 'WHERE', 'GROUP BY', 'LIMIT'],
      correctIndex: 1,
      explanation: '`WHERE` filters candidate rows (e.g. `SELECT id FROM users WHERE active = true`).',
    },
    {
      question: 'How do engineers definitively eliminate SQL Injection vulnerabilities in backend queries?',
      options: ['Stripping single quotes manually', 'Using Parameterized Queries (Prepared Statements) separating SQL syntax from data values', 'Hiding table names', 'Running queries twice'],
      correctIndex: 1,
      explanation: 'Prepared statements transmit SQL query templates separately from bound parameter values at the database driver level.',
    },
    {
      question: 'Which HTTP method sends non-idempotent form or resource creation payloads in the request body?',
      options: ['GET', 'POST', 'HEAD', 'OPTIONS'],
      correctIndex: 1,
      explanation: 'POST submits payloads inside the HTTP body rather than query parameters.',
    },
    {
      question: 'Which `Set-Cookie` flag blocks browser JavaScript (`document.cookie`) from reading sensitive session cookies?',
      options: ['HttpOnly', 'Domain', 'Path', 'Max-Age'],
      correctIndex: 0,
      explanation: '`HttpOnly` isolates authentication cookies from DOM scripts, reducing XSS token exfiltration.',
    },
    {
      question: 'What does an `INNER JOIN` do in a relational SQL database?',
      options: ['Drops duplicate indexes', 'Combines rows from two tables where join key predicates match', 'Compresses JSON blobs', 'Restarts the database server'],
      correctIndex: 1,
      explanation: '`JOIN` links normalized tables cleanly across primary-key and foreign-key columns.',
    },
  ],
  'stage-6': [
    {
      question: 'In C programming, what does the ampersand operator `&x` produce?',
      options: ['Bitwise XOR', 'The memory address of variable `x`', 'Dereferences `x`', 'Logical AND'],
      correctIndex: 1,
      explanation: '`&` is the address-of operator, producing a typed pointer (`T *`) to the variable location in memory.',
    },
    {
      question: 'What occurs when a C program allocates heap memory with `malloc()` and never calls `free()`?',
      options: ['Automatic Python GC runs', 'A memory leak occurs, leaving heap pages allocated until process termination', 'Compiler warns at boot', 'Stack pointer resets'],
      correctIndex: 1,
      explanation: 'Heap blocks remain reserved until explicitly passed to `free()`, risking exhaustion in long-lived daemons.',
    },
    {
      question: 'Why does C require disciplined bounds checking on raw arrays and buffers?',
      options: ['C checks bounds automatically at runtime', 'Writing past an array length triggers Buffer Overflow and corrupts adjacent stack or heap memory', 'Arrays resize on demand', 'Pointers ignore sizes'],
      correctIndex: 1,
      explanation: 'Raw C arrays decay to pointers with zero runtime length checks; out-of-bounds writes corrupt adjacent memory.',
    },
    {
      question: 'What does `gcc -O2 -Wall -Wextra -std=c11` enable during compilation?',
      options: ['Disables errors', 'Enables C11 standard, optimizer pass O2, and strict warning diagnostics', 'Runs Python interpreter', 'Deletes debug symbols'],
      correctIndex: 1,
      explanation: '`-Wall -Wextra` surface dangerous conversions, uninitialized reads, and signedness bugs at compile time.',
    },
    {
      question: 'If `int *p` points to element 0 of an `int` array (`sizeof(int) == 4`), by how many bytes does `p + 1` advance?',
      options: ['1 byte', '4 bytes (`sizeof(int)`)', '8 bytes', '16 bytes'],
      correctIndex: 1,
      explanation: 'Pointer arithmetic scales offsets automatically by the pointed type size (`sizeof(*p)`).',
    },
  ],
  'stage-7': [
    {
      question: 'What does the C++ idiom RAII ("Resource Acquisition Is Initialization") guarantee?',
      options: ['Garbage collection every second', 'Resources acquired in constructors are deterministically released by destructors when scope exits', 'Manual `free()` everywhere', 'Global mutable locks'],
      correctIndex: 1,
      explanation: 'Even when early returns or exceptions unwind the stack, C++ destructors deterministic release handles, sockets, and memory.',
    },
    {
      question: 'Which Modern C++ smart pointer expresses exclusive, zero-overhead single ownership of heap memory?',
      options: ['Raw `void *`', '`std::unique_ptr<T>`', '`malloc()`', '`std::weak_ref`'],
      correctIndex: 1,
      explanation: '`std::unique_ptr` compiles to the same size as a raw pointer while automatically freeing memory when destroyed.',
    },
    {
      question: 'How does `vec.at(i)` differ from `vec[i]` on `std::vector`?',
      options: ['They are identical', '`vec.at(i)` performs bounds checking and throws `std::out_of_range` instead of silent UB', '`vec.at(i)` allocates disk space', '`vec[i]` only reads floats'],
      correctIndex: 1,
      explanation: '`at()` validates indices against `.size()` while `[]` prioritizes unchecked maximum speed.',
    },
    {
      question: 'Why prefer `const std::string&` over pass-by-value `std::string` for read-only function parameters?',
      options: ['It mutates caller strings', 'It avoids unnecessary heap string copies while preventing accidental mutation', 'It disables templates', 'It converts UTF-8 to ASCII'],
      correctIndex: 1,
      explanation: 'Passing by `const` reference eliminates deep string duplication without risking mutation.',
    },
    {
      question: 'Which compiler sanitizer detects use-after-free and out-of-bounds heap/stack writes during C/C++ testing?',
      options: ['`-fsanitize=address` (ASan)', '`-std=c89`', '`-S`', '`-E`'],
      correctIndex: 0,
      explanation: 'AddressSanitizer instruments memory accesses to abort immediately with exact stack traces on memory corruption.',
    },
  ],
  'stage-8': [
    {
      question: 'In Go, how do functions idiomatic signal recoverable runtime failures instead of raising hidden exceptions?',
      options: ['Returning explicit `(value, error)` tuples checked immediately by callers', 'Throwing Java-style checked exceptions', 'Using `goto fail`', 'Ignoring return values'],
      correctIndex: 0,
      explanation: 'Go treats errors as explicit first-class values (`if err != nil { return err }`) making control flow transparent.',
    },
    {
      question: 'How do Goroutines communicate and synchronize safely across concurrent workloads in Go?',
      options: ['Shared unsynchronized globals', 'Typed Channels (`chan T`) and `select` statements following CSP ("share memory by communicating")', 'OS forks per loop', 'Polling files on disk'],
      correctIndex: 1,
      explanation: 'Goroutines are lightweight multiplexed tasks coordinating cleanly via channels and `sync` primitives.',
    },
    {
      question: 'Why pass `context.WithTimeout` into Go HTTP handlers, database queries, and microservice calls?',
      options: ['To speed up JSON serialization', 'To propagate cancellation deadlines and prevent goroutine leaks or cascading hangs', 'To encrypt TLS headers', 'To bypass DNS'],
      correctIndex: 1,
      explanation: 'Bounded contexts abort slow downstream RPCs immediately when clients disconnect or SLA deadlines expire.',
    },
    {
      question: 'Why must production `http.Server` and `http.Client` instances in Go always configure explicit timeouts?',
      options: ['Go defaults have zero timeouts (`Timeout: 0`), exposing services to Slowloris socket exhaustion', 'Timeouts compress HTTP responses', 'Timeouts enable HTTP/3 automatically', 'Only TLS requires timeouts'],
      correctIndex: 0,
      explanation: 'Default `http.Client{}` and zero-value `http.Server` wait indefinitely on stalled sockets unless explicit deadlines are set.',
    },
    {
      question: 'What does `defer file.Close()` accomplish in a Go function?',
      options: ['Closes the file immediately before reading', 'Schedules `Close()` to execute reliably right before the surrounding function returns', 'Spawns a background thread', 'Deletes the file'],
      correctIndex: 1,
      explanation: '`defer` guarantees cleanup runs on every return path near the acquisition line.',
    },
  ],
  'stage-9': [
    {
      question: 'In x86-64 architecture, what does the instruction pointer register `RIP` always hold?',
      options: ['Function return integer', 'The memory address of the next machine instruction to execute', 'Heap allocator pointer', 'Kernel PID'],
      correctIndex: 1,
      explanation: 'The CPU advances `RIP` through each fetched instruction, jumping on branches, calls, and returns.',
    },
    {
      question: 'Under the Linux System V AMD64 calling convention, which register holds the first integer/pointer function argument and which holds the return value?',
      options: ['`RDI` holds argument 1; `RAX` holds return value', '`RSP` holds argument 1; `RBX` holds return value', '`RCX` holds both', '`R15` holds return value'],
      correctIndex: 0,
      explanation: 'Integer/pointer args pass in `RDI, RSI, RDX, RCX, R8, R9` and integer returns exit in `RAX`.',
    },
    {
      question: 'Which command inside `gdb` sets a breakpoint on `main` and disassembles machine instructions?',
      options: ['`break main` and `disassemble main`', '`ls -la` and `grep`', '`compile main`', '`ping localhost`'],
      correctIndex: 0,
      explanation: 'GDB `break`, `run`, `info registers`, `x/16gx $rsp`, and `disassemble` inspect live binary state.',
    },
    {
      question: 'What do the first 4 bytes `7f 45 4c 46` (`\\x7fELF`) signify at the start of a Linux binary?',
      options: ['PNG image header', 'ELF (Executable and Linkable Format) magic bytes identifying a Linux executable/shared library', 'Encrypted AES payload', 'UTF-8 BOM'],
      correctIndex: 1,
      explanation: 'Operating system loaders inspect magic signatures like `\\x7fELF` to parse sections, symbols, and entry points.',
    },
    {
      question: 'What primary capability does Ghidra add beyond linear assembly listings during reverse engineering?',
      options: ['Network stress testing', 'Interactive CFG recovery and decompilation from machine opcodes into readable pseudo-C', 'GPU overclocking', 'Package hosting'],
      correctIndex: 1,
      explanation: 'Ghidra reconstructs functions, control-flow graphs, stack frames, and high-level pseudo-C for auditing binaries.',
    },
  ],
  'stage-10': [
    {
      question: 'What three core principles form the "CIA Triad" in information security?',
      options: ['Central, Internal, Automated', 'Confidentiality, Integrity, Availability', 'Credentials, Inspection, Auditing', 'Crypto, Identity, Access'],
      correctIndex: 1,
      explanation: 'Confidentiality (privacy), Integrity (tamper-resistance), and Availability (reliable uptime) anchor security design.',
    },
    {
      question: 'How does cryptographic hashing differ fundamentally from encryption and Base64 encoding?',
      options: ['Base64 is military-grade encryption', 'Hashing is one-way (`SHA-256`), encryption is reversible only with a secret key, and Base64 is reversible public formatting', 'Hashing is easily decrypted', 'All three hide keys identically'],
      correctIndex: 1,
      explanation: 'Confusing encoding (Base64) with hashing (`SHA-256` / Argon2id) or keyed encryption (`AES-GCM`) causes severe flaws.',
    },
    {
      question: 'Why must per-user random salts and slow memory-hard KDFs (Argon2id/bcrypt) protect stored passwords?',
      options: ['To shorten passwords', 'To defeat precomputed rainbow tables and slow offline GPU brute-force attacks', 'To allow plaintext recovery', 'To compress SQL rows'],
      correctIndex: 1,
      explanation: 'Unique salts neutralize precomputed hash tables while Argon2id raises memory/time cost per guess.',
    },
    {
      question: 'Which rule strictly governs running port scanners or security payloads in CS Odyssey?',
      options: ['Scan any public website', 'Only test systems you own locally or authorized educational labs (OverTheWire, picoCTF, PortSwigger Academy) within written scope', 'Bypass campus firewalls', 'Scan random IP ranges'],
      correctIndex: 1,
      explanation: 'Authorized scope separates disciplined security engineering from unlawful unauthorized access.',
    },
    {
      question: 'What OWASP category arises when untrusted client inputs flow unvalidated into SQL queries, shell commands, or HTML DOM?',
      options: ['Broken Hardware Clock', 'Injection & Cross-Site Scripting (XSS)', 'DNS TTL Expiry', 'RAID Parity Loss'],
      correctIndex: 1,
      explanation: 'Untrusted input crossing parser boundaries without parameterization or encoding enables Injection and XSS.',
    },
  ],
  'stage-11': [
    {
      question: 'What makes an engineering portfolio repository stand out to reviewers and mentors?',
      options: ['A copied tutorial with zero tests', 'Clean modular code, automated tests, a clear README with trade-offs, and reproducible setup steps', 'A slide deck without code', 'Uncommented generated files'],
      correctIndex: 1,
      explanation: 'Reproducible builds, regression tests, and honest architectural trade-offs prove real systems fluency.',
    },
    {
      question: 'Why does a top-notch `README.md` matter in open-source engineering?',
      options: ['Git requires it to push', 'It documents purpose, architecture, local setup, security guarantees, and test verification commands', 'It reduces binary size', 'It disables CI'],
      correctIndex: 1,
      explanation: 'A crisp README turns raw code into an accessible, maintainable artifact for contributors and reviewers.',
    },
    {
      question: 'How do engineers break free from "tutorial hell"?',
      options: ['Watch tutorials at 3x speed', 'Design and ship small original tools from scratch using official docs and debugging', 'Avoid writing code', 'Copy answers verbatim'],
      correctIndex: 1,
      explanation: 'Independent problem solving forces mental model formation around real compiler errors and architecture.',
    },
    {
      question: 'Which defensive role commonly serves as an early-career stepping stone into systems security?',
      options: ['Junior SOC / Detection Engineer', 'Chief Information Security Officer', 'Board Director', 'Principal Cryptanalyst'],
      correctIndex: 0,
      explanation: 'Junior SOC and detection engineering roles sharpen alert triage, packet inspection, and log telemetry skills.',
    },
    {
      question: 'What habit drives steady multi-year mastery in software engineering?',
      options: ['Cramming once a year', 'Consistent weekly deliberate practice building, reading source/RFCs, and writing post-mortems', 'Avoiding hard topics', 'Ignoring error logs'],
      correctIndex: 1,
      explanation: 'Small weekly sprints building and debugging real systems compound remarkably over time.',
    },
  ],
  'stage-12': [
    {
      question: 'What is the average-case and worst-case time complexity of Merge Sort on an array of N elements?',
      options: ['O(N) average, O(N^2) worst', 'O(N log N) in both average and worst case', 'O(log N) worst case', 'O(N^2) in all cases'],
      correctIndex: 1,
      explanation: 'Merge Sort always divides the array in half (log N levels) and merges N elements per level, guaranteeing O(N log N) worst-case time.',
    },
    {
      question: 'Why does a Hash Table deliver O(1) expected lookup time?',
      options: ['It sorts every key on each insert', 'A hash function maps keys directly to bucket indices in a contiguous array with short collision chains', 'It scans all buckets with binary search', 'It compresses strings to 1 bit'],
      correctIndex: 1,
      explanation: 'When load factor is bounded and keys hash uniformly, direct array indexing locates buckets in constant expected time.',
    },
    {
      question: 'Which shortest-path algorithm uses a min-priority queue to find shortest paths on graphs with non-negative edge weights?',
      options: ['Depth-First Search (DFS)', "Dijkstra's Algorithm", 'Bubble Sort', "Kruskal's Cycle Check"],
      correctIndex: 1,
      explanation: "Dijkstra's greedy relaxation expands the closest unsettled vertex from a min-heap, requiring non-negative edge weights.",
    },
    {
      question: 'What property distinguishes Dynamic Programming from plain recursion?',
      options: ['Using global variables only', 'Caching overlapping subproblems (memoization or bottom-up tabulation) to avoid exponential recomputation', 'Using pointers instead of integers', 'Disabling base cases'],
      correctIndex: 1,
      explanation: 'Dynamic programming combines optimal substructure with overlapping subproblems stored once in a table.',
    },
    {
      question: 'Which data structure maintains the minimum (or maximum) element at the root with O(log N) insert and extract?',
      options: ['Binary Heap (Priority Queue)', 'Singly Linked List', 'Fixed Stack', 'Unordered Array'],
      correctIndex: 0,
      explanation: 'A binary heap stores a complete tree compactly in an array, sifting up or down along tree height log2(N).',
    },
  ],
  'stage-13': [
    {
      question: 'In a typical compiler pipeline, what is the correct ordering of early-to-middle stages?',
      options: ['Machine Code -> Lexer -> Parser', 'Lexer (Tokens) -> Parser (AST) -> Semantic Analysis -> Intermediate Representation (IR)', 'Linker -> Lexer -> Preprocessor', 'Register Allocation -> Tokenizing'],
      correctIndex: 1,
      explanation: 'Frontends tokenize source characters (lexing), build syntax trees (parsing), type-check (semantics), and lower to IR.',
    },
    {
      question: 'Why do modern compilers (like LLVM) convert programs into Static Single Assignment (SSA) IR?',
      options: ['To turn C into Python', 'Each variable is assigned exactly once, making dataflow optimizations and dead-code elimination precise and fast', 'To disable optimization', 'To run programs without a CPU'],
      correctIndex: 1,
      explanation: 'SSA makes def-use chains explicit, simplifying constant propagation, loop-invariant code motion, and register allocation.',
    },
    {
      question: 'In distributed systems, what problem does the Raft consensus algorithm solve?',
      options: ['Encrypting TLS certificates', 'Keeping a replicated log consistent across nodes via leader election and majority quorums despite crashes', 'Drawing pixels in CSS', 'Compiling Rust crates'],
      correctIndex: 1,
      explanation: 'Raft elects a single leader per term and commits log entries only after a majority quorum acknowledges replication.',
    },
    {
      question: 'According to the CAP theorem, when a network partition occurs between distributed nodes, what must a system choose between?',
      options: ['Speed and Memory', 'Consistency (linearizability) vs Availability (responding on both sides of the partition)', 'SQL and JSON', 'TCP and DNS'],
      correctIndex: 1,
      explanation: 'During a network split (Partition), a stateful store either rejects minority writes to stay Consistent (CP) or accepts writes risking divergence to stay Available (AP).',
    },
    {
      question: 'What does a Lamport logical clock establish in a distributed cluster?',
      options: ['Microsecond GPS synchronization', 'A strict partial "happens-before" ordering of causal events across machines without physical clocks', 'Faster Ethernet frames', 'AES key rotation'],
      correctIndex: 1,
      explanation: 'Lamport timestamps increment on local events and carry max(local, remote) + 1 across messages to preserve causal ordering.',
    },
  ],
  'stage-14': [
    {
      question: 'Which two Linux kernel features combine under the hood to isolate processes inside containers?',
      options: ['HTML5 Canvas and WebSockets', 'Namespaces (isolating PID/net/mount visibility) and cgroups (enforcing CPU/RAM quotas)', 'BIOS interrupts and FAT32', 'Dynamic DNS and Swap files'],
      correctIndex: 1,
      explanation: 'Containers share the host Linux kernel: namespaces scope what a process sees while cgroups bound CPU/memory usage.',
    },
    {
      question: 'Why use multi-stage Docker builds (`FROM ... AS builder`) and non-root `USER` instructions in production images?',
      options: ['To slow down CI builds', 'To discard compilers from final runtime layers, shrink attack surface, and follow least privilege', 'To embed `.env` secrets safely', 'To disable health checks'],
      correctIndex: 1,
      explanation: 'Multi-stage images ship only runtime artifacts, eliminating build toolchains and avoiding unnecessary root privileges.',
    },
    {
      question: 'How does Kubernetes maintain declared cluster state when a worker Pod crashes unexpectedly?',
      options: ['Requires an engineer to SSH in manually', 'Control-plane controllers run continuous reconciliation loops comparing desired replicas vs actual status and reschedule missing Pods', 'Rewrites DNS locally on laptops', 'Turns off TLS'],
      correctIndex: 1,
      explanation: 'Kubernetes uses declarative level-triggered reconciliation loops to converge actual cluster state toward YAML specs.',
    },
    {
      question: 'Why track `p95` and `p99` tail latency rather than relying solely on average ("mean") request latency?',
      options: ['Means are slow to compute', 'Extreme outliers affecting 1–5% of users or cascading microservices fan-out are hidden by simple averages', 'p99 ignores network time', 'Averages require logs'],
      correctIndex: 1,
      explanation: 'In fan-out architectures, slow 99th-percentile dependencies stall overall page completion even when mean latency looks healthy.',
    },
    {
      question: 'What security benefit do reproducible CI builds and Software Bills of Materials (SBOMs) provide?',
      options: ['Faster Wi-Fi speeds', 'Verifiable provenance tracing exact dependency versions so vulnerable packages can be audited and patched immediately', 'Skipping code review', 'Removing automated tests'],
      correctIndex: 1,
      explanation: 'CI pipelines enforcing tests, lockfiles, and SBOM attestation catch supply-chain regressions before deployment.',
    },
  ],
  'stage-15': [
    {
      question: 'What is the geometric meaning of the dot product `a · b` of two normalized unit vectors in linear algebra and embeddings?',
      options: ['The sum of array lengths', 'The cosine similarity (`cos θ`) measuring directional alignment between two vectors', 'The determinant of a 3D matrix', 'Memory stride offset'],
      correctIndex: 1,
      explanation: 'Normalized dot products directly yield `cos(θ)`, powering semantic similarity search and attention scoring.',
    },
    {
      question: 'How does Backpropagation efficiently compute parameter gradients across deep neural networks?',
      options: ['Finite differences per weight', 'Applying the calculus chain rule in reverse topological order (`loss -> outputs -> weights`), reusing intermediate activations', 'Random search', 'Sorting matrices'],
      correctIndex: 1,
      explanation: 'Reverse-mode automatic differentiation avoids redundant passes by reusing upstream partial derivatives (`dL/dz`).',
    },
    {
      question: 'Why do numerical Softmax implementations subtract `max(logits)` before exponentiating (`exp(x - max(x))`)?',
      options: ['To convert probabilities to negative numbers', 'To prevent IEEE-754 floating-point overflow (`inf` / `NaN`) while leaving the output distribution identical', 'To divide by zero intentionally', 'To prune weights'],
      correctIndex: 1,
      explanation: 'Exponentiating large raw logits overflows 64-bit/32-bit floats; shifting by `max(x)` is mathematically invariant and numerically stable.',
    },
    {
      question: 'In Transformer Scaled Dot-Product Attention (`softmax((Q K^T) / sqrt(d_k)) V`), why divide by `sqrt(d_k)`?',
      options: ['To shrink the model file size', 'To keep dot-product variance near 1 as head dimension `d_k` grows so softmax gradients do not saturate', 'To double GPU memory usage', 'To sort tokens alphabetically'],
      correctIndex: 1,
      explanation: 'Without `1 / sqrt(d_k)` scaling, large dot products push Softmax into tiny-gradient saturation regions.',
    },
    {
      question: 'Why does row-major loop ordering (`i -> k -> j`) or cache blocking drastically accelerate dense matrix multiplication in C?',
      options: ['C disables registers in `j`-first loops', 'Contiguous memory strides exploit spatial cache lines and hardware prefetching instead of thrashing L1/L2 cache', 'It skips floating-point math', 'Matrices must be square'],
      correctIndex: 1,
      explanation: 'Streaming contiguous `float` / `double` elements maximizes CPU cache-line utilization and enables SIMD vectorization.',
    },
  ],
};

export function validateQuizItems(raw: unknown): QuizQuestionItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const cleaned: QuizQuestionItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const question = typeof obj.question === 'string' ? obj.question.trim() : '';
    const explanation = typeof obj.explanation === 'string' ? obj.explanation.trim() : '';
    const rawOptions = Array.isArray(obj.options)
      ? obj.options.filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
      : [];
    const correctIndex = typeof obj.correctIndex === 'number' ? Math.floor(obj.correctIndex) : -1;
    if (
      question.length > 5 &&
      rawOptions.length >= 2 &&
      correctIndex >= 0 &&
      correctIndex < rawOptions.length
    ) {
      cleaned.push({
        question,
        options: rawOptions.slice(0, 4),
        correctIndex,
        explanation: explanation || 'Review the corresponding stage notes to verify this concept.',
      });
    }
  }
  return cleaned.length >= 3 ? cleaned.slice(0, 5) : null;
}

export function getFallbackQuizForStage(stageId?: string): QuizQuestionItem[] {
  if (stageId && STAGE_FALLBACK_QUIZZES[stageId]) {
    return STAGE_FALLBACK_QUIZZES[stageId];
  }
  return STAGE_FALLBACK_QUIZZES['stage-0'];
}

export function buildLocalEli9Response(stageId: string | undefined, promptText: string): string {
  const normalized = promptText.toLowerCase();
  const activeStage = STAGES_DATA.find((s) => s.id === stageId) || STAGES_DATA[0];

  // Search all topics across stages for relevant match
  const scoredTopics = STAGES_DATA.flatMap((stage) =>
    stage.topics.map((topic) => {
      const haystack = `${topic.title} ${topic.description} ${topic.eli9}`.toLowerCase();
      const words = normalized.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
      const hits = words.reduce((acc, w) => (haystack.includes(w) ? acc + 1 : acc), 0);
      return { stage, topic, hits };
    })
  ).sort((a, b) => b.hits - a.hits);

  const best = scoredTopics[0];
  if (best && best.hits > 0) {
    const snippetBlock = best.topic.codeSnippet
      ? `\n### Hands-On Example (${best.topic.codeSnippet.language.toUpperCase()})\n\`\`\`${best.topic.codeSnippet.language}\n${best.topic.codeSnippet.code.trimEnd()}\n\`\`\`\n*Why it matters:* ${best.topic.codeSnippet.explanation}\n`
      : '';

    return [
      `### ${best.topic.title} (Stage ${best.stage.number})`,
      '',
      `**Intuitive Analogy:** ${best.topic.eli9}`,
      '',
      `**Technical Breakdown:** ${best.topic.description}`,
      snippetBlock,
      `**Next Step in Workbench:** Practice this in Stage ${best.stage.number} ("${best.stage.title.split(':')[0]}") and verify against the stage Exit Gate checklist.`,
    ].join('\n');
  }

  return [
    `### ${activeStage.title} — Study Guide`,
    '',
    `**Mental Model:** ${activeStage.eli9Metaphor}`,
    '',
    `**Goal for this Stage:** ${activeStage.goal}`,
    '',
    `**Key Topics to Focus On:**`,
    ...activeStage.topics.slice(0, 4).map((t) => `- **${t.title}:** ${t.eli9}`),
    '',
    `**Pro Tip:** Test small assumptions in the **Code Playground** or **Terminal Shell** before trying to memorize syntax.`,
  ].join('\n');
}

export function buildLocalDebugResponse(codeOrError: string, promptText: string): string {
  const combined = `${codeOrError}\n${promptText}`.toLowerCase();

  if (combined.includes('segmentation fault') || combined.includes('sigsegv') || combined.includes('core dumped')) {
    return [
      '### Diagnosis: Segmentation Fault (SIGSEGV)',
      '',
      '**What happened:** Your C program tried to read or write a memory address it does not own (often dereferencing a `NULL` pointer, going past array bounds, or using memory after `free()`).',
      '',
      '**Common Causes & Fixes:**',
      '1. Check every `malloc()` / `calloc()` return value for `NULL` before writing to it.',
      '2. Verify loop bounds stay strictly `< length` (remember an array of size `N` stops at index `N - 1`).',
      '3. Ensure `scanf("%d", &var)` includes `&` so `scanf` receives the variable address rather than its uninitialized value.',
    ].join('\n');
  }

  if (combined.includes('indentationerror') || combined.includes('expected an indented block')) {
    return [
      '### Diagnosis: Python IndentationError',
      '',
      '**What happened:** Python groups code inside `if`, `for`, `while`, and `def` blocks using consistent leading spaces (4 spaces per level).',
      '',
      '**How to fix it:**',
      '```python',
      'for i in range(5):',
      '    print(i)  # Exactly 4 spaces inside the loop',
      '```',
      'Never mix tabs and spaces on adjacent lines.',
    ].join('\n');
  }

  if (combined.includes('eoferror')) {
    return [
      '### Diagnosis: Python EOFError on `input()`',
      '',
      '**What happened:** Your script called `input()`, but no lines were fed into Standard Input (`stdin`) before the stream ended.',
      '',
      '**Fix:** Click the **Stdin** button in the Code Playground toolbar and enter one line per `input()` call before hitting **Run Code**.',
    ].join('\n');
  }

  if (combined.includes('no such file or directory') || combined.includes('cat: -')) {
    return [
      '### Diagnosis: Shell Path or Dashed Filename Parsing',
      '',
      '**What happened:** Either the file is in another folder, its name contains spaces/hidden dots, or it starts with `-` (which commands mistake for an option flag).',
      '',
      '**Verify & Fix:**',
      '```bash',
      'pwd && ls -la       # Reveal hidden dotfiles and exact names',
      'cat ./-             # Safely read a file named "-"',
      'cat "spaces in this filename"',
      '```',
    ].join('\n');
  }

  if (combined.includes('implicit declaration') || combined.includes('undeclared')) {
    return [
      '### Diagnosis: Missing C Header or Forward Declaration',
      '',
      '**What happened:** The C compiler saw a function or symbol before knowing its signature.',
      '',
      '**Checklist:**',
      '- `#include <stdio.h>` for `printf` / `scanf`',
      '- `#include <stdlib.h>` for `malloc` / `free` / `atoi`',
      '- `#include <string.h>` for `strlen` / `strncpy`',
      '- `#include <math.h>` for `sqrt` / `pow`',
    ].join('\n');
  }

  return [
    '### Structured Debug Checklist',
    '',
    '**1. Isolate the minimal failing case:** Comment out unrelated blocks or test the single failing line with printed inputs.',
    '**2. Inspect types & boundaries:** Verify variable types (`int` vs `double` vs pointer), off-by-one loop limits, and array lengths.',
    '**3. Verify toolchain & paths:**',
    '```bash',
    'pwd && ls -la   # In Shell',
    'gcc -O2 -Wall -Wextra -std=c11 main.c -o main.out -lm',
    '```',
    'Paste the exact compiler/runtime error message into the top box for targeted line-by-line feedback.',
  ].join('\n');
}

export function buildLocalLabReviewResponse(stageTitle: string, promptText: string): string {
  const words = promptText.trim().split(/\s+/).filter(Boolean).length;
  const hasCommands = /`|\$|gcc|python|ls|cat|git|curl|nmap|SELECT/i.test(promptText);
  const hasVerification = /test|verify|output|result|assert|expected|exit/i.test(promptText);

  return [
    `### Lab Write-Up Review (${stageTitle || 'Systems Lab'})`,
    '',
    `**Strengths Observed:**`,
    `1. Documentation submitted (${words} words) toward building a reproducible engineering record.`,
    hasCommands
      ? '2. Concrete commands or source snippets are included for reproducibility.'
      : '2. Clear narrative framing of the experiment context.',
    '',
    `**Actionable Improvements:**`,
    !hasCommands
      ? '1. Include the exact terminal commands or source code used so another engineer can reproduce your steps verbatim.'
      : '1. Annotate why each flag or argument was chosen (engineering rationale).',
    !hasVerification
      ? '2. Add an explicit **Verification / Output** section showing the observed result vs expected output.'
      : '2. Add a brief **Failure Modes & Scope** note documenting edge cases and confirming safe sandbox boundaries.',
  ].join('\n');
}

export function buildLocalStudyPlanResponse(
  stageId: string | undefined,
  completedTopicsCount: number,
  dailyGoalMinutes: number
): string {
  const activeStage = STAGES_DATA.find((s) => s.id === stageId) || STAGES_DATA[0];
  const safeGoal = Math.max(15, Math.min(240, Math.floor(dailyGoalMinutes || 45)));
  const warmMin = Math.max(5, Math.round(safeGoal * 0.25));
  const buildMin = Math.max(10, Math.round(safeGoal * 0.55));
  const checkMin = Math.max(5, safeGoal - warmMin - buildMin);

  return [
    `### Personalized Daily Roadmap · Stage ${activeStage.number}: ${activeStage.title.split(':')[0]}`,
    '',
    `**Progress Baseline:** ${completedTopicsCount} topics mastered · Daily Target: **${safeGoal} minutes/day**`,
    '',
    `**Daily Session Split (${safeGoal}m):**`,
    `1. **Intuition (${warmMin}m):** Read the Stage ${activeStage.number} mental model and distill 1 core mechanism in your notes.`,
    `2. **Active Lab (${buildMin}m):** Work through ${activeStage.topics.slice(0, 2).map((t) => `"${t.title}"`).join(' & ')} inside the Code Playground or Wargame Shell.`,
    `3. **Exit Verification (${checkMin}m):** Close references, verify one Exit Gate criterion cold, and mark the topic complete (+15m streak log).`,
    '',
    `**Stage Deliverable Milestone:** ${activeStage.practiceTask.title} — ${activeStage.practiceTask.deliverable}`,
  ].join('\n');
}

export function sanitizeGroundingSources(chunks: unknown): SearchSourceCitation[] {
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const citations: SearchSourceCitation[] = [];

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web;
    if (!web || typeof web.uri !== 'string') continue;

    try {
      const parsed = new URL(web.uri.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
      const href = parsed.toString();
      if (seen.has(href)) continue;
      seen.add(href);

      const rawTitle = typeof web.title === 'string' && web.title.trim() ? web.title.trim() : parsed.hostname;
      citations.push({
        title: rawTitle.slice(0, 120),
        uri: href,
      });

      if (citations.length >= 6) break;
    } catch {
      continue;
    }
  }

  return citations;
}

export function buildLocalSearchGroundingResponse(
  stageId: string | undefined,
  promptText: string
): { result: string; sources: SearchSourceCitation[] } {
  const words = promptText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  const rankedSources = CURATED_CS_SOURCES.map((src) => {
    const hay = `${src.title} ${src.authorOrOrg} ${src.domain} ${src.whyItMatters}`.toLowerCase();
    const hits = words.reduce((acc, w) => (hay.includes(w) ? acc + 2 : acc), 0);
    const stageBoost = stageId && src.stageIds.includes(stageId) ? 1 : 0;
    return { src, score: hits + stageBoost };
  }).sort((a, b) => b.score - a.score);

  const selected = rankedSources.slice(0, 4).map((item) => item.src);
  const sources: SearchSourceCitation[] = selected.map((src) => ({
    title: `${src.title} — ${src.authorOrOrg}`,
    uri: src.url,
  }));

  const coreSynthesis = buildLocalEli9Response(stageId, promptText);
  const referenceList = selected
    .map((s) => `- **${s.title}** (${s.authorOrOrg}): ${s.whyItMatters}`)
    .join('\n');

  return {
    result: [
      coreSynthesis,
      '',
      '### Grounded Technical References',
      referenceList,
    ].join('\n'),
    sources,
  };
}


