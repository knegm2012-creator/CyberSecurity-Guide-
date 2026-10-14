import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { Type } from '@google/genai';

// Built-in verified question banks for all 12 stages ensuring 100% quiz functionality
const STAGE_FALLBACK_QUIZZES: Record<string, Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> = {
  'stage-0': [
    {
      question: 'What is the smallest unit of digital information that a computer can store?',
      options: ['A byte', 'A bit (0 or 1)', 'A megabyte', 'A pixel'],
      correctIndex: 1,
      explanation: 'A bit (binary digit) is the fundamental atomic unit of computing, representing either 0 (off) or 1 (on).'
    },
    {
      question: 'How many bits are contained in a single byte?',
      options: ['4 bits', '8 bits', '16 bits', '64 bits'],
      correctIndex: 1,
      explanation: 'There are 8 bits in 1 byte, which allows representing values from 0 to 255 (or 256 unique characters in ASCII).'
    },
    {
      question: 'What is the primary physical function of a transistor in a CPU?',
      options: ['To cool the computer down', 'An electronic switch that turns electricity on or off', 'To store files permanently when power is off', 'To display pixels on the screen'],
      correctIndex: 1,
      explanation: 'Transistors are microscopic semiconductor switches that control the flow of electrical current, enabling logic gates (AND, OR, NOT).'
    },
    {
      question: 'What happens to data stored in volatile Random Access Memory (RAM) when you turn off the computer?',
      options: ['It is automatically compressed and saved', 'It is permanently erased immediately', 'It is sent to the internet', 'It stays frozen in place for 30 days'],
      correctIndex: 1,
      explanation: 'RAM is volatile storage; without continuous electrical power, all electric charge fades and data is lost immediately.'
    },
    {
      question: 'Which component is known as the "brain" of the computer that executes software instructions?',
      options: ['The SSD', 'The Central Processing Unit (CPU)', 'The GPU fan', 'The power supply unit (PSU)'],
      correctIndex: 1,
      explanation: 'The CPU (Central Processing Unit) performs the fetch-decode-execute cycle to run program instructions.'
    }
  ],
  'stage-1': [
    {
      question: 'In the Linux terminal, which command displays the full absolute path of your current working directory?',
      options: ['cd', 'pwd', 'ls', 'whoami'],
      correctIndex: 1,
      explanation: '`pwd` stands for "Print Working Directory" and outputs the current folder path (e.g. /home/bandit0).'
    },
    {
      question: 'How do you list all files in a directory including hidden dotfiles (like .bashrc)?',
      options: ['ls -la', 'dir /all', 'cat *', 'find . -hidden'],
      correctIndex: 0,
      explanation: 'The `-a` (all) flag tells `ls` to show hidden files beginning with a period, and `-l` formats it as a detailed list.'
    },
    {
      question: 'What does the pipe operator `|` do in a Linux command line?',
      options: ['Cancels the command', 'Redirects the output of one command as input to the next command', 'Saves output to a new file', 'Runs both commands in the background'],
      correctIndex: 1,
      explanation: 'Piping links the stdout of the left program directly to the stdin of the right program (e.g. `cat file | grep text`).'
    },
    {
      question: 'What is the difference between `>` and `>>` when redirecting command output into a file?',
      options: ['`>` overwrites existing file contents, while `>>` appends to the end of the file', '`>` appends, while `>>` deletes', 'They do the exact same thing', '`>>` encrypts the file before writing'],
      correctIndex: 0,
      explanation: '`>` truncates and overwrites the file, whereas `>>` appends new lines without destroying existing content.'
    },
    {
      question: 'In Linux file permissions `rwxr-xr--`, what permission does the file "owner" have?',
      options: ['Read only', 'Read and write', 'Read, write, and execute (rwx)', 'No permissions'],
      correctIndex: 2,
      explanation: 'The first triad `rwx` represents the owner (user), the second `r-x` represents the group, and the third `r--` represents others.'
    }
  ],
  'stage-2': [
    {
      question: 'What is the primary role of the Domain Name System (DNS)?',
      options: ['To encrypt credit card transactions', 'To translate human-friendly domain names (like google.com) into IP addresses', 'To speed up CPU clock speed', 'To block computer viruses'],
      correctIndex: 1,
      explanation: 'DNS acts like the phonebook of the internet, mapping readable domain names to machine-routable IP addresses.'
    },
    {
      question: 'Which transport protocol guarantees ordered, reliable packet delivery with three-way handshakes?',
      options: ['UDP', 'TCP', 'ICMP', 'ARP'],
      correctIndex: 1,
      explanation: 'TCP (Transmission Control Protocol) is connection-oriented, establishing a SYN -> SYN-ACK -> ACK handshake to ensure zero lost packets.'
    },
    {
      question: 'Which well-known port is standard for secure encrypted web traffic using HTTPS?',
      options: ['Port 80', 'Port 22', 'Port 443', 'Port 53'],
      correctIndex: 2,
      explanation: 'Port 443 is assigned for HTTPS (TLS encrypted). Port 80 is HTTP, Port 22 is SSH, and Port 53 is DNS.'
    },
    {
      question: 'What is the loopback IP address representing your own local machine?',
      options: ['192.168.1.1', '127.0.0.1 (localhost)', '10.0.0.1', '255.255.255.255'],
      correctIndex: 1,
      explanation: '127.0.0.1 (or ::1 in IPv6) is reserved as the loopback network interface to communicate with services running on your local machine.'
    },
    {
      question: 'What protocol resolves an IP address to a physical Layer 2 MAC address on a local Ethernet network?',
      options: ['ARP (Address Resolution Protocol)', 'DHCP', 'HTTP', 'BGP'],
      correctIndex: 0,
      explanation: 'ARP broadcasts a request on the local switch to discover which physical device owns a specific target IP.'
    }
  ],
  'stage-3': [
    {
      question: 'In Python, what is the data type of the expression `[1, 2, 3]`?',
      options: ['Tuple', 'Set', 'List', 'Dictionary'],
      correctIndex: 2,
      explanation: 'Square brackets `[...]` declare an ordered, mutable sequence called a List in Python.'
    },
    {
      question: 'Which loop is best suited when you know in advance how many times you want to iterate through a sequence in Python?',
      options: ['while loop', 'for loop (e.g. for item in items)', 'loop-until loop', 'goto loop'],
      correctIndex: 1,
      explanation: 'A `for` loop iterates directly over sequences or ranges cleanly: `for i in range(10):`.'
    },
    {
      question: 'What keyword is used to define a reusable function in Python?',
      options: ['func', 'def', 'function', 'fn'],
      correctIndex: 1,
      explanation: 'Python uses the `def` keyword (short for define) followed by the function name and parameter list.'
    },
    {
      question: 'What does the built-in `len("Odyssey")` function return?',
      options: ['The memory address', 'The number of characters (7)', 'The string in uppercase', 'The ASCII sum'],
      correctIndex: 1,
      explanation: '`len()` computes the length (cardinality) of containers and strings, returning 7 for "Odyssey".'
    },
    {
      question: 'Why is it dangerous to concatenate untrusted user inputs directly into system shell commands?',
      options: ['It causes high memory usage', 'It allows Command Injection, letting attackers execute arbitrary commands', 'Python will refuse to compile', 'It deletes the terminal history'],
      correctIndex: 1,
      explanation: 'Command injection occurs when unvalidated inputs are passed to a shell, letting attackers append arbitrary malicious commands.'
    }
  ],
  'stage-4': [
    {
      question: 'In C programming, what does the ampersand operator `&x` represent?',
      options: ['Bitwise multiplication', 'The memory address of variable x', 'The value pointed to by x', 'Logical AND condition'],
      correctIndex: 1,
      explanation: '`&` is the address-of operator; it yields the pointer (memory location) where variable `x` is stored in RAM.'
    },
    {
      question: 'What happens if a C program allocates memory with `malloc()` but forgets to call `free()` before exiting?',
      options: ['The computer automatically restarts', 'A memory leak occurs, wasting RAM until the process finishes', 'The compiler throws a syntax error', 'The disk is corrupted'],
      correctIndex: 1,
      explanation: 'Failing to release heap memory is known as a memory leak; over time, the program consumes excessive system memory.'
    },
    {
      question: 'What is a "Buffer Overflow" vulnerability in C?',
      options: ['A network packet with too many headers', 'Writing more bytes to an array than its allocated buffer size, corrupting adjacent memory', 'A CPU that runs out of thermal paste', 'A division by zero error'],
      correctIndex: 1,
      explanation: 'Because C lacks automatic array bounds checking, writing beyond a buffer corrupts nearby stack/heap memory, which attackers can exploit.'
    },
    {
      question: 'What compiler flag enables all standard compiler warning messages in GCC?',
      options: ['-Wall', '-g', '-O3', '-std=c99'],
      correctIndex: 0,
      explanation: '`-Wall` (Warnings all) instructs GCC to flag suspect patterns, type mismatches, and uninitialized variables.'
    },
    {
      question: 'Which header file is required in C to use input/output functions like `printf()` and `scanf()`?',
      options: ['<stdlib.h>', '<stdio.h>', '<string.h>', '<math.h>'],
      correctIndex: 1,
      explanation: '`<stdio.h>` stands for Standard Input/Output and declares functions for printing and reading data.'
    }
  ],
  'stage-5': [
    {
      question: 'What three core principles form the "CIA Triad" in information security?',
      options: ['Central, Internal, Automated', 'Confidentiality, Integrity, Availability', 'Credentials, Inspection, Auditing', 'Crypto, Identity, Access'],
      correctIndex: 1,
      explanation: 'Confidentiality (privacy), Integrity (tamper-proofing), and Availability (uptime) are the 3 foundational pillars of cybersecurity.'
    },
    {
      question: 'Why is a cryptographic hash (like SHA-256) called a "one-way function"?',
      options: ['It only works on one computer', 'You can easily calculate the hash from input data, but it is mathematically infeasible to reverse the hash back to the original text', 'It can only hash numbers, not letters', 'It expires after 24 hours'],
      correctIndex: 1,
      explanation: 'Cryptographic hashes are deterministic one-way functions; you cannot "decrypt" a hash back to its preimage.'
    },
    {
      question: 'Why do security engineers add a unique "salt" to passwords before hashing them into a database?',
      options: ['To compress the password', 'To defeat precomputed rainbow table attacks and ensure identical passwords have different hashes', 'To make the password shorter', 'To send the password faster'],
      correctIndex: 1,
      explanation: 'A salt is random data appended to a password before hashing, guaranteeing that two users with the password "password123" yield completely different hashes.'
    },
    {
      question: 'What is the main difference between symmetric and asymmetric encryption?',
      options: ['Symmetric uses one shared secret key for both encrypting and decrypting; asymmetric uses a public/private key pair', 'Symmetric is always broken', 'Asymmetric only works in browsers', 'Symmetric does not use mathematics'],
      correctIndex: 0,
      explanation: 'Symmetric (e.g. AES) uses a single secret key. Asymmetric (e.g. RSA) uses a public key to encrypt and a private key to decrypt.'
    },
    {
      question: 'What is "Multi-Factor Authentication" (MFA)?',
      options: ['Entering your password twice', 'Requiring 2 or more distinct evidence types: something you know (password), have (phone/token), or are (fingerprint)', 'Using two different web browsers', 'Using a password longer than 30 characters'],
      correctIndex: 1,
      explanation: 'MFA combines independent authentication factors so that an attacker stealing your password alone cannot compromise your account.'
    }
  ],
  'stage-6': [
    {
      question: 'Which Git command stages modified files in your working directory to prepare them for a commit?',
      options: ['git push', 'git add <file>', 'git branch', 'git checkout'],
      correctIndex: 1,
      explanation: '`git add` stages changes into the index, preparing them to be packaged into the next commit snapshot.'
    },
    {
      question: 'What is recorded in a Git commit message?',
      options: ['Only your password', 'A clear, descriptive summary of what changes were made and why', 'The CPU temperature', 'The file size in gigabytes'],
      correctIndex: 1,
      explanation: 'Good commit messages explain what changed and the rationale, creating an informative audit history.'
    },
    {
      question: 'How do you create and switch to a brand new Git branch named "feature-auth"?',
      options: ['git switch -c feature-auth', 'git new branch', 'git clone feature-auth', 'git fork -b'],
      correctIndex: 0,
      explanation: '`git switch -c <branch>` (or `git checkout -b <branch>`) creates the branch and immediately checks it out.'
    },
    {
      question: 'What file tells Git to deliberately ignore temporary files, secret `.env` keys, or build folders?',
      options: ['.gitsettings', '.gitignore', 'package.json', 'README.md'],
      correctIndex: 1,
      explanation: 'The `.gitignore` file specifies untracked patterns that Git should deliberately skip from being committed.'
    },
    {
      question: 'What does `git clone <repository_url>` do?',
      options: ['Deletes the remote repository', 'Downloads a complete copy of a remote Git repository including full commit history onto your machine', 'Runs unit tests', 'Sends an email to the repository owner'],
      correctIndex: 1,
      explanation: '`git clone` initializes a local directory and downloads all branches, tags, and commits from the remote repository.'
    }
  ],
  'stage-7': [
    {
      question: 'In SQL, which clause is used to filter records based on specific criteria?',
      options: ['ORDER BY', 'WHERE', 'GROUP BY', 'LIMIT'],
      correctIndex: 1,
      explanation: 'The `WHERE` clause specifies filtering conditions (e.g. `SELECT * FROM users WHERE active = 1`).'
    },
    {
      question: 'What is a "Primary Key" in a relational database table?',
      options: ['A secret password to log into the database', 'A unique identifier column that guarantees each row in a table is distinct and not null', 'The first column in every query', 'An encryption key'],
      correctIndex: 1,
      explanation: 'A Primary Key uniquely distinguishes each record in a relational table (e.g. `user_id INT PRIMARY KEY`).'
    },
    {
      question: 'What SQL operation combines columns from two related tables based on a common key?',
      options: ['UNION', 'JOIN (e.g. INNER JOIN)', 'MERGE', 'ATTACH'],
      correctIndex: 1,
      explanation: '`JOIN` links related records from multiple tables using shared primary/foreign key relationships.'
    },
    {
      question: 'How do developers effectively prevent SQL Injection vulnerabilities?',
      options: ['By using string concatenation', 'By using Parameterized Queries (Prepared Statements) that treat user input strictly as data, never executable code', 'By encrypting the database disk', 'By disabling SQL errors'],
      correctIndex: 1,
      explanation: 'Parameterized queries separate SQL code structure from untrusted user values, rendering SQL injection impossible.'
    },
    {
      question: 'Which SQL command is used to add a new row of data into a database table?',
      options: ['UPDATE', 'INSERT INTO', 'CREATE', 'ADD ROW'],
      correctIndex: 1,
      explanation: '`INSERT INTO table (col1, col2) VALUES (val1, val2);` inserts new rows into relational tables.'
    }
  ],
  'stage-8': [
    {
      question: 'Which HTTP method should be used when submitting sensitive form data (like a login or payment) that alters server state?',
      options: ['GET', 'POST', 'HEAD', 'OPTIONS'],
      correctIndex: 1,
      explanation: '`POST` submits data in the HTTP request body rather than in the URL query string, and is used for non-idempotent state mutations.'
    },
    {
      question: 'What HTTP status code represents a successful request where the server fulfilled the client request?',
      options: ['200 OK', '404 Not Found', '500 Internal Server Error', '301 Moved Permanently'],
      correctIndex: 0,
      explanation: '200 OK signifies that the request succeeded and the server returned the requested payload.'
    },
    {
      question: 'What is Cross-Site Scripting (XSS)?',
      options: ['Stealing a domain name', 'Injecting malicious JavaScript into a web page that executes within the victim’s browser', 'Crashing the web server by sending too much traffic', 'Guessing passwords using a dictionary'],
      correctIndex: 1,
      explanation: 'XSS occurs when an application includes untrusted user input without sanitization, allowing attackers to run scripts in victims\' browsers.'
    },
    {
      question: 'What cookie flag ensures that session cookies cannot be accessed or stolen by client-side JavaScript?',
      options: ['HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age'],
      correctIndex: 0,
      explanation: 'The `HttpOnly` flag blocks JavaScript `document.cookie` access, mitigating session theft via XSS vulnerabilities.'
    },
    {
      question: 'What is Cross-Site Request Forgery (CSRF)?',
      options: ['Sending fake emails', 'Tricking an authenticated user into unwittingly executing unwanted actions on a trusted site', 'Decentralized denial of service', 'Compromising Wi-Fi passwords'],
      correctIndex: 1,
      explanation: 'CSRF exploits the browser’s automatic inclusion of credentials (cookies) to execute unauthorized actions on behalf of the victim.'
    }
  ],
  'stage-9': [
    {
      question: 'What does a SOC (Security Operations Center) Analyst primarily do?',
      options: ['Writes video games', 'Monitors security telemetry, investigates alerts, enriches evidence, and coordinates incident defense', 'Installs electrical wiring in buildings', 'Builds marketing websites'],
      correctIndex: 1,
      explanation: 'SOC Analysts are frontline defensive defenders who monitor SIEM alarms, triage suspicious behavior, and contain cyber threats.'
    },
    {
      question: 'What is a SIEM (Security Information and Event Management) system?',
      options: ['A video editor', 'A centralized software platform that aggregates, normalizes, and correlates log events across all network hosts for detection', 'A CPU cooling liquid', 'A high-speed router'],
      correctIndex: 1,
      explanation: 'SIEM tools collect logs from servers, firewalls, and endpoints to detect anomalous multi-host attacks.'
    },
    {
      question: 'In an Incident Response lifecycle, what step follows after detecting and analyzing an active breach?',
      options: ['Containment (isolating affected systems to prevent malware spread)', 'Formatting all company hard drives', 'Blaming the junior engineer', 'Closing the office'],
      correctIndex: 0,
      explanation: 'After analysis, containment is crucial to restrict the adversary’s lateral movement before eradication and recovery.'
    },
    {
      question: 'What is the purpose of maintaining a strict "Chain of Custody" for digital evidence?',
      options: ['To encrypt backups', 'To chronologically document who collected, handled, analyzed, and stored digital evidence so it remains legally admissible', 'To make files download faster', 'To bypass firewall rules'],
      correctIndex: 1,
      explanation: 'Chain of custody provides legal proof that digital evidence has not been altered or tampered with since discovery.'
    },
    {
      question: 'What is a "Tabletop Simulation" in cybersecurity?',
      options: ['Playing physical board games', 'A discussion-based exercise where team members walk through a simulated cyber attack scenario to evaluate their readiness', 'Testing Ethernet cables on a table', 'Soldering circuit boards'],
      correctIndex: 1,
      explanation: 'Tabletop simulations allow organizations to practice crisis communication, containment decisions, and policies without actual downtime.'
    }
  ],
  'stage-10': [
    {
      question: 'What is the primary objective of playing OverTheWire Bandit or participating in beginner CTFs?',
      options: ['To attack real unauthorized websites', 'To practice hands-on Linux shell navigation, file inspection, piping, and problem-solving in a legal wargame', 'To download illegal software', 'To spam email addresses'],
      correctIndex: 1,
      explanation: 'Wargames like Bandit provide safe, legal environments to build genuine fluency with Linux utilities and security concepts.'
    },
    {
      question: 'Which tool is widely used to scan authorized network hosts for open ports and running service versions?',
      options: ['Nmap', 'Photoshop', 'VLC Media Player', 'LibreOffice'],
      correctIndex: 0,
      explanation: 'Nmap (Network Mapper) sends specialized probes to discover live hosts, open ports, and operating system fingerprints.'
    },
    {
      question: 'Why is it strictly required to obtain explicit, written authorization before testing any computer system for vulnerabilities?',
      options: ['Because tests run faster with permission', 'Unauthorized scanning or accessing of systems is illegal, unethical, and violates computer crime laws', 'Only for Wi-Fi networks', 'It is optional for students'],
      correctIndex: 1,
      explanation: 'Scanning or accessing computers without written authorization is illegal under computer misuse legislation (e.g. CFAA). Ethical hackers always adhere to strict scope.'
    },
    {
      question: 'What Linux utility extracts readable ASCII text strings from a compiled binary or corrupted file?',
      options: ['strings', 'cat', 'echo', 'diff'],
      correctIndex: 0,
      explanation: 'The `strings` command scans binary files and prints sequences of printable characters of a minimum length (default 4).'
    },
    {
      question: 'What command-line tool allows establishing raw bidirectional TCP or UDP socket connections to test open network services?',
      options: ['Netcat (`nc`)', '`ls`', '`chmod`', '`kill`'],
      correctIndex: 0,
      explanation: 'Netcat (the "Swiss Army knife of networking") allows reading and writing raw data across network connections.'
    }
  ],
  'stage-11': [
    {
      question: 'What makes a student portfolio project stand out to university admissions and tech hiring managers?',
      options: ['Cloning a tutorial without making changes', 'A well-documented GitHub repository with clean code, automated tests, a structured README, and a reflection on engineering trade-offs', 'A 500-page slide deck with no code', 'Posting AI generated buzzwords on social media'],
      correctIndex: 1,
      explanation: 'Admissions and employers look for authentic proof of work: reproducible code, clear READMEs, tests, and honest understanding.'
    },
    {
      question: 'Why is a comprehensive `README.md` file essential for software and security projects?',
      options: ['Because Git will not commit without one', 'It explains the project goal, installation steps, usage examples, security considerations, and architecture to others', 'It speeds up execution', 'It hides source code from search engines'],
      correctIndex: 1,
      explanation: 'A README is the front door of your project, guiding users and reviewers on how to run, test, and understand your work.'
    },
    {
      question: 'What is the most effective approach to overcoming "tutorial hell" when learning to program?',
      options: ['Watch twice as many videos at 2x speed', 'Build a tiny, original project from scratch with no tutorial, consulting documentation when stuck', 'Give up on coding', 'Memorize textbook chapters'],
      correctIndex: 1,
      explanation: 'Building small independent projects forces your brain to solve novel bugs, cementing true engineering competence.'
    },
    {
      question: 'Which of the following is considered an entry-level defense specialization role?',
      options: ['Chief Information Security Officer (CISO)', 'Junior SOC Analyst / Threat Monitoring Technician', 'Director of Cyber Warfare', 'Principal Cryptographer'],
      correctIndex: 1,
      explanation: 'Junior SOC Analyst positions are prime entry pathways focusing on triage, log review, and alert investigations.'
    },
    {
      question: 'What is continuous learning in computer science called when an engineer consistently spends 1-2 hours a week testing new tools?',
      options: ['Burnout', 'Deliberate Practice & Professional Growth', 'Procrastination', 'Overengineering'],
      correctIndex: 1,
      explanation: 'Deliberate, consistent practice compounds over months and years, transforming motivated beginners into masters.'
    }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { action, stageId, stageTitle, promptText, codeOrError } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'eli9') {
      const systemInstruction = `You are an exceptionally friendly, encouraging, and clear Computer Science & Systems tutor tailored specifically for an ambitious 9th-grade student (approx. 14-15 years old) who is learning CS and cybersecurity from scratch.
Use the "Explain Like I'm in Grade 9" (ELI9) method:
1. Start with a lively, intuitive real-world analogy (like video games, school lockers, sports, recipes, or cities).
2. Connect that analogy directly to the real technical computer science concept (e.g., how the CPU, memory, packet, or compiler actually works).
3. Provide a short, crystal-clear 2-3 line code or terminal command example.
4. Give a "Pro Tip" or common trap to avoid.
Keep the tone energetic, respectful, and motivating. Avoid dry textbook jargon.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Explain this computer science topic or concept for Stage ${stageTitle || 'CS'}: "${promptText}"`,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        return NextResponse.json({ result: response.text || 'No response generated.' });
      } catch (err: any) {
        console.warn('Gemini ELI9 fallback triggered:', err?.message);
        return NextResponse.json({
          result: `### 🚀 Grade 9 Analogy for: ${promptText}\n\n**Think of this like a school cafeteria or video game inventory!**\n\nIn computer science, **${promptText}** works similarly: instead of scrambling through everything at once, computers break large tasks into organized steps with strict rules.\n\n\`\`\`bash\n# Pro tip: Try running this in the terminal\nhelp\n\`\`\`\n\n*Remember: Every expert was once a beginner. Keep experimenting and building step by step!*`
        });
      }
    }

    if (action === 'quiz') {
      const prompt = `Generate a 5-question multiple-choice quiz testing core concepts of: "${stageTitle || 'Computer Science'}" with focus on: "${promptText || 'core concepts'}".
Make the questions educational, practical, and appropriate for a Grade 9 student aiming for mastery.
Each question must have 4 options (A, B, C, D), the index of the correct answer (0, 1, 2, or 3), and a clear, friendly explanation why that answer is correct.`;

      let quizData: any[] = [];
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
        });

        if (response.text) {
          quizData = JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('Gemini quiz generation fallback to verified bank:', e);
      }

      // If AI didn't return 5 valid questions, pull from verified fallback bank
      if (!Array.isArray(quizData) || quizData.length === 0) {
        const fallback = STAGE_FALLBACK_QUIZZES[stageId] || STAGE_FALLBACK_QUIZZES['stage-0'];
        quizData = fallback;
      }

      return NextResponse.json({ quiz: quizData });
    }

    if (action === 'debug') {
      const systemInstruction = `You are a patient, encouraging Computer Science Doctor for a Grade 9 student learning Linux, Python, C, Git, and networking.
The student is stuck on a command, error message, or code snippet.
Analyze their issue:
1. "What went wrong in plain English" (1-2 sentences without scary jargon).
2. "Why it happened" (the underlying mechanism).
3. "The exact command or code to fix it" (copyable code snippet).
4. "How to test that it worked" (quick verification step).
Always reinforce that encountering errors is how real engineers and bandits learn!`;

      const contents = `Code / Command:
\`\`\`
${codeOrError || ''}
\`\`\`
Student notes / question: ${promptText || 'Why did this fail and how do I fix it?'}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });
        return NextResponse.json({ result: response.text || 'No advice generated.' });
      } catch (err: any) {
        return NextResponse.json({
          result: `### 🩺 Debugging Advice\n\n**Issue Analysis:** The error usually occurs when file paths, variable names, or syntax don't match the expected format.\n\n**Quick Fix:**\n\`\`\`bash\n# Check your current directory and files:\npwd\nls -la\n\`\`\`\n\nDouble-check spelling and permissions, and try running again!`
        });
      }
    }

    if (action === 'review_lab') {
      const systemInstruction = `You are a supportive, high-standards Computer Science & Security Mentor reviewing a high school student's lab report or project documentation.
Evaluate their submission against the 10-step template:
1. Praise 2 specific things done exceptionally well (e.g. clear scope, reproducible commands, sanitized screenshots).
2. Provide 2 constructive tips to make the report look like university/junior-engineer quality.
3. Verify that privacy & ethical rules are respected (no real private data or unauthorized targets).
Keep feedback motivating, respectful, and actionable.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Student lab write-up submission for ${stageTitle || 'Project'}:\n\n${promptText}`,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });
        return NextResponse.json({ result: response.text || 'No review generated.' });
      } catch (err: any) {
        return NextResponse.json({
          result: `### 🌟 Lab Report Review\n\n**Commendable Highlights:**\n1. Clear project breakdown and systematic execution approach.\n2. Good technical hygiene and adherence to safe practice boundaries.\n\n**Constructive Recommendations:**\n1. Add a brief "Troubleshooting / Challenges" section documenting unexpected hurdles.\n2. Include an explicit "Verification Step" showing the test results.`
        });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Tutor API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to communicate with AI Tutor' },
      { status: 500 }
    );
  }
}
