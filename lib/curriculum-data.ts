export interface TopicItem {
  id: string;
  title: string;
  description: string;
  eli9: string;
  codeSnippet?: {
    language: 'python' | 'c';
    code: string;
    explanation: string;
  };
  externalLinks?: Array<{
    title: string;
    url: string;
    type: 'Course' | 'Video' | 'Article' | 'Docs';
  }>;
}

export interface CommandItem {
  name: string;
  syntax: string;
  category: 'Linux' | 'Git' | 'Networking' | 'SQL' | 'C/C++' | 'Security' | 'Dev' | 'System' | 'Docker';
  explanation: string;
  example: string;
  safeNote?: string;
}

export interface ResourceItem {
  title: string;
  url: string;
  type: 'Course' | 'Book' | 'Lab' | 'Docs' | 'Video' | 'Tool';
  isFree: boolean;
  costNote?: string;
  notes: string;
}

export interface StageData {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  timeEstimate: string;
  sprintMonth: string;
  goal: string;
  eli9Metaphor: string;
  topics: TopicItem[];
  commands: CommandItem[];
  resources: ResourceItem[];
  practiceTask: {
    title: string;
    description: string;
    deliverable: string;
  };
  exitChecklist: string[];
  safetyWarning: string;
}

export interface BanditLevel {
  level: number;
  title: string;
  goal: string;
  sshCommand: string;
  usefulCommands: string[];
  hint: string;
  solutionConcept: string;
  sampleFlagFormat: string;
}

export interface PortfolioProject {
  id: string;
  number: number;
  title: string;
  tools: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  brief: string;
  acceptanceCriteria: string[];
  learningOutcome: string;
}

export interface SpecializationTrack {
  id: string;
  name: string;
  role: string;
  whatItDoes: string;
  foundations: string;
  beginnerProof: string;
}

export interface GlossaryTerm {
  term: string;
  simpleEnglish: string;
  category: 'Network' | 'System' | 'Security' | 'Dev' | 'Hardware' | 'Web' | 'Database' | 'Theory';
}

export interface TroubleshootingItem {
  problem: string;
  solution: string;
}

export const STAGES_DATA: StageData[] = [
  {
    id: 'stage-0',
    number: 0,
    title: 'Basics: Computers, Math, Binary & Digital Foundations',
    subtitle: 'Math fundamentals, binary, hex, Boolean logic, CPU/RAM, and workspace setup',
    timeEstimate: '2-3 weeks',
    sprintMonth: 'Month 1 (Weeks 1-3)',
    goal: 'Master digital data representation (binary, hex, powers of 2), Boolean logic gates, CPU/RAM hardware architecture, and computer math before opening VS Code or writing programs.',
    eli9Metaphor: 'Before building a skyscraper, you have to understand steel and bricks. In computer science, everything—from video games to encryption—is built on tiny electrical switches (0 and 1), powers of 2, and logic gates. Master this bedrock first, and programming will make total sense!',
    topics: [
      {
        id: 's0-t0',
        title: 'Introduction to Computer Science & Computational Thinking',
        description: 'Computer Science is the study of computation, information theory, and systematic problem solving using algorithms, abstraction, pattern recognition, and decomposition. It transforms complex real-world challenges into finite state machines and deterministic instructions.',
        eli9: 'Computer Science is not just about fixing laptops—it is teaching a lightning-fast, obedient robot how to solve riddles step-by-step using precise recipes called algorithms!',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrates algorithm decomposition: counting steps and solving the prime number search problem systematically.',
          code: `# Computational Thinking: Prime Finder Algorithm
def is_prime(n):
    """Systematically test divisibility with optimal square-root boundary."""
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

test_numbers = [2, 7, 15, 29, 33, 97, 100]
print("--- Prime Number Detection ---")
for num in test_numbers:
    status = "PRIME" if is_prime(num) else "COMPOSITE"
    print(f"Number {num:3d} -> {status}")
`
        },
        externalLinks: [
          { title: 'Harvard CS50: Computational Thinking', url: 'https://cs50.harvard.edu/x/', type: 'Course' },
          { title: 'Crash Course CS #1: Early Computing', url: 'https://www.youtube.com/watch?v=O5nskjZ_GoI', type: 'Video' },
          { title: 'Khan Academy: What is Computing?', url: 'https://www.khanacademy.org/computing', type: 'Article' }
        ]
      },
      {
        id: 's0-t1',
        title: 'How Computers Work: CPU, ALU, RAM & The Instruction Cycle',
        description: 'Discover how microscopic transistors act as electrical switches (0V / 5V) to form logic gates, registers, and the Arithmetic Logic Unit (ALU). Understand the Fetch-Decode-Execute instruction cycle, CPU clock cycles, L1/L2/L3 caches, volatile RAM memory, and non-volatile storage.',
        eli9: 'The CPU is a lightning-fast chef with tiny hands (Registers), RAM is the wide kitchen counter holding open recipes, and the SSD is the deep storage freezer down in the basement!',
        codeSnippet: {
          language: 'python',
          explanation: 'Simulating the CPU Fetch-Decode-Execute cycle with Program Counter (PC), Accumulator register, and instructions.',
          code: `# Toy CPU Architecture Simulation: Fetch-Decode-Execute Cycle
class ToyCPU:
    def __init__(self):
        self.pc = 0           # Program Counter
        self.accumulator = 0  # General register (ALU output)
        self.memory = [
            ("LOAD", 15),     # Fetch instruction 0
            ("ADD", 27),      # Fetch instruction 1
            ("SUB", 5),       # Fetch instruction 2
            ("PRINT", None),  # Fetch instruction 3
            ("HALT", None)    # Fetch instruction 4
        ]
        self.halted = False

    def step(self):
        # 1. Fetch
        opcode, operand = self.memory[self.pc]
        print(f"[PC={self.pc}] Fetching: {opcode} {operand or ''}")
        self.pc += 1

        # 2. Decode & Execute
        if opcode == "LOAD":
            self.accumulator = operand
        elif opcode == "ADD":
            self.accumulator += operand
        elif opcode == "SUB":
            self.accumulator -= operand
        elif opcode == "PRINT":
            print(f">>> ALU Accumulator Output: {self.accumulator}")
        elif opcode == "HALT":
            self.halted = True
            print(">>> CPU Halted cleanly.")

cpu = ToyCPU()
while not cpu.halted:
    cpu.step()
`
        },
        externalLinks: [
          { title: 'Crash Course CS: How CPUs Work (Ep 7)', url: 'https://www.youtube.com/watch?v=FZGugFqDr60', type: 'Video' },
          { title: 'Code.org: How Computers Work', url: 'https://code.org/curriculum/how-computers-work', type: 'Video' },
          { title: 'Nand2Tetris: The Elements of Computing Systems', url: 'https://www.nand2tetris.org', type: 'Course' }
        ]
      },
      {
        id: 's0-t2',
        title: 'Bits, Bytes, Nibbles & Binary (Base-2 Number System)',
        description: 'Understand electrical voltage logic (high=1, low=0), binary place values (1, 2, 4, 8, 16, 32, 64, 128), and how to convert any decimal number into 8-bit binary by hand using repeated division or powers of two.',
        eli9: 'Computers cannot read numbers like 42. They only have tiny microscopic switches: OFF is 0, ON is 1. Place values double each step: 1, 2, 4, 8, 16, 32, 64, 128!',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrating decimal-to-binary bitmask inspection and powers of 2 breakdown.',
          code: `# Decimal to 8-Bit Binary Conversion by First Principles
def decimal_to_8bit_binary(n):
    bits = []
    powers = [128, 64, 32, 16, 8, 4, 2, 1]
    remainder = n
    for p in powers:
        if remainder >= p:
            bits.append("1")
            remainder -= p
        else:
            bits.append("0")
    return "".join(bits)

for val in [0, 1, 5, 42, 127, 255]:
    bin_str = decimal_to_8bit_binary(val)
    print(f"Decimal {val:3d} = Binary {bin_str} (Built-in: {bin(val)})")
`
        },
        externalLinks: [
          { title: 'Khan Academy: Binary Numbers', url: 'https://www.khanacademy.org/math/algebra-home/alg-intro-to-algebra/algebra-alternate-number-bases/v/number-bases', type: 'Video' },
          { title: '3Blue1Brown: Binary Mathematics', url: 'https://www.3blue1brown.com', type: 'Article' },
          { title: 'Math is Fun: Binary System', url: 'https://www.mathsisfun.com/binary-number-system.html', type: 'Docs' }
        ]
      },
      {
        id: 's0-t3',
        title: 'Hexadecimal & Memory Addressing (Base-16)',
        description: 'Why engineers use hex (0-9, A-F), how each hex digit maps directly to 4 binary bits (a nibble), and recognizing hex in memory addresses (0x7ffe...), MAC addresses, and hash digests.',
        eli9: 'Writing 8 bits like 11111111 is exhausting. Hexadecimal groups 4 bits into one character (1111 = F), so 11111111 becomes FF! It is shorthand for binary.',
        codeSnippet: {
          language: 'python',
          explanation: 'Converting decimal to hexadecimal and mapping 4-bit binary nibbles to hex digits.',
          code: `# Hexadecimal & Memory Address Simulator
val = 42
hex_repr = hex(val) # '0x2a'
bin_repr = bin(val) # '0b101010'

# Format as 32-bit and 64-bit memory addresses
virtual_addr_32 = f"0x{val:08X}"
virtual_addr_64 = f"0x{val:016X}"

print(f"Decimal Value: {val}")
print(f"Hex Representation: {hex_repr}")
print(f"Formatted 32-bit Memory Pointer: {virtual_addr_32}")
print(f"Formatted 64-bit Memory Pointer: {virtual_addr_64}")

# Demonstrate Nibble mapping (4 bits = 1 Hex character)
byte_val = 0xAF
upper_nibble = (byte_val >> 4) & 0x0F  # 0xA = 1010
lower_nibble = byte_val & 0x0F         # 0xF = 1111
print(f"Byte 0xAF -> High Nibble: {hex(upper_nibble)} ({upper_nibble:04b}), Low Nibble: {hex(lower_nibble)} ({lower_nibble:04b})")
`
        },
        externalLinks: [
          { title: 'CS50: Memory & Hexadecimal', url: 'https://cs50.harvard.edu/x/2024/weeks/4/', type: 'Course' },
          { title: 'GeeksforGeeks: Hexadecimal Base', url: 'https://www.geeksforgeeks.org/hexadecimal-number-system/', type: 'Docs' }
        ]
      },
      {
        id: 's0-t4',
        title: 'Boolean Logic Gates & Truth Tables (AND, OR, NOT, XOR)',
        description: 'Master Boolean operations: AND, OR, NOT, XOR. Draw and verify truth tables, and understand how logic gates combine inside the CPU to perform addition and comparisons.',
        eli9: 'Logic gates are like bouncers at a club door. AND only lets you in if BOTH ticket AND ID are valid. XOR only lets you in if you have EITHER one, but NEVER both!',
        codeSnippet: {
          language: 'python',
          explanation: 'Constructing complete truth tables and a 1-bit binary half-adder using logic gates.',
          code: `# Logic Gates & Truth Table Simulator
def half_adder(a, b):
    sum_bit = a ^ b   # XOR gate calculates the sum bit
    carry_bit = a & b # AND gate calculates the carry bit
    return sum_bit, carry_bit

print("--- Boolean Logic Truth Tables ---")
print("A | B | AND | OR  | XOR | Half-Adder (Sum, Carry)")
print("-" * 52)
for a in [0, 1]:
    for b in [0, 1]:
        s, c = half_adder(a, b)
        print(f"{a} | {b} |  {a & b}  |  {a | b}  |  {a ^ b}  | Sum={s}, Carry={c}")
`
        },
        externalLinks: [
          { title: 'Computerphile: Boolean Logic Gates', url: 'https://www.youtube.com/watch?v=gI-qXk7XojA', type: 'Video' },
          { title: 'Nand2Tetris: Boolean Logic', url: 'https://www.nand2tetris.org/project01', type: 'Course' }
        ]
      },
      {
        id: 's0-t5',
        title: 'Signed Integers, Two\'s Complement & Byte Overflow',
        description: 'Learn how computers represent negative numbers using Two\'s Complement (MSB sign bit), and what happens when an 8-bit counter exceeds 255 (integer overflow security bug).',
        eli9: 'Like a car odometer that flips from 999,999 back to 000,000, an 8-bit byte that reaches 255 and adds 1 flips back to 0! Hackers exploit this to bypass limit checks.',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrating 8-bit Two\'s Complement conversion and integer overflow boundary wrapping.',
          code: `# Two's Complement & 8-Bit Overflow Demonstration
def to_twos_complement_8bit(val):
    if val < 0:
        return (1 << 8) + val
    return val

def from_twos_complement_8bit(byte_val):
    if byte_val >= 128:
        return byte_val - 256
    return byte_val

print("--- Two's Complement 8-Bit Representation ---")
for num in [0, 1, 42, 127, -1, -42, -128]:
    twos = to_twos_complement_8bit(num)
    print(f"Number: {num:4d} -> Binary: {twos:08b} (Hex: 0x{twos:02X})")

# Simulated 8-bit unsigned overflow: 255 + 1
counter = 255
counter = (counter + 1) & 0xFF  # Simulates 8-bit hardware truncation
print(f"\\n8-Bit Overflow: 255 + 1 wrapped to -> {counter}")
`
        },
        externalLinks: [
          { title: 'Computerphile: Signed Numbers', url: 'https://www.youtube.com/watch?v=lKTsv6iVxV4', type: 'Video' },
          { title: 'GeeksforGeeks: Two\'s Complement', url: 'https://www.geeksforgeeks.org/twos-complement/', type: 'Article' }
        ]
      },
      {
        id: 's0-t6',
        title: 'ASCII & Character Encoding (UTF-8)',
        description: 'How letters, digits, and punctuation map to byte values (e.g. \'A\'=65=0x41, \'a\'=97=0x61), why text files are raw binary streams, and why text/images require encoding standards.',
        eli9: 'The computer does not know what the letter "A" looks like. It agreed with all computers in the world that number 65 means "A", 66 means "B", and 32 is a space bar.',
        codeSnippet: {
          language: 'python',
          explanation: 'Inspecting ASCII character codes, binary representations, and UTF-8 multi-byte sequences.',
          code: `# ASCII & UTF-8 Encoding Inspector
message = "CS Hero!"
print("Char | ASCII Dec | Hex  | Binary")
print("-" * 34)
for ch in message:
    code = ord(ch)
    print(f" '{ch}' |    {code:3d}    | 0x{code:02X} | {code:08b}")

# UTF-8 multi-byte encoding for emojis and international symbols
emoji = "🚀"
emoji_bytes = emoji.encode('utf-8')
print(f"\\nEmoji {emoji} UTF-8 bytes ({len(emoji_bytes)} bytes): {[hex(b) for b in emoji_bytes]}")
`
        },
        externalLinks: [
          { title: 'Joel on Software: Unicode & UTF-8', url: 'https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/', type: 'Article' },
          { title: 'ASCII Chart Reference', url: 'https://www.asciitable.com/', type: 'Docs' }
        ]
      },
      {
        id: 's0-t7',
        title: 'Files, Folders, File Extensions & Path Hierarchies',
        description: 'Understand how operating systems organize data, absolute vs relative paths, what extensions (.py, .c, .txt, .json) mean to compilers, and path navigation.',
        eli9: 'File extensions are like name tags that tell the computer what tool to use to open them. Paths are the exact GPS coordinates in your folder tree.',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrating path resolution, relative paths, and file extensions using standard library pathlib.',
          code: `from pathlib import Path

# Working with OS paths in modern code
base_dir = Path("/home/student/cs-odyssey")
source_file = base_dir / "src" / "main.py"

print(f"Full Path:      {source_file}")
print(f"Filename:       {source_file.name}")
print(f"Extension:      {source_file.suffix}")
print(f"Parent Folder:  {source_file.parent}")
print(f"Is Absolute?    {source_file.is_absolute()}")

# Relative navigation: . (current) vs .. (parent)
relative_sample = Path("../notebooks/week1.md")
print(f"Relative Path:  {relative_sample}")
`
        },
        externalLinks: [
          { title: 'Linux Journey: Navigating the Filesystem', url: 'https://linuxjourney.com/', type: 'Course' },
          { title: 'Real Python: Python Pathlib Guide', url: 'https://realpython.com/python-pathlib/', type: 'Article' }
        ]
      }
    ],
    commands: [
      {
        name: 'python3 math',
        syntax: 'python3 -c "print(bin(42), hex(42), 2**16)"',
        category: 'Dev',
        explanation: 'Quickly converts decimal values to binary and hex, and calculates powers of 2 directly from the shell.',
        example: 'python3 -c "print(f\'Binary: {42:08b}, Hex: {42:02X}\')"'
      },
      {
        name: 'git config',
        syntax: 'git config --global user.name "Your Name" && git config --global user.email "you@example.com"',
        category: 'Git',
        explanation: 'Labels your code commits with your author identity.',
        example: 'git config --global user.name "Kareem Student"'
      },
      {
        name: 'git init',
        syntax: 'git init',
        category: 'Git',
        explanation: 'Initializes a new empty Git version control repository in the current folder.',
        example: 'mkdir my-odyssey && cd my-odyssey && git init'
      },
      {
        name: 'python --version',
        syntax: 'python3 --version',
        category: 'Linux',
        explanation: 'Checks if Python 3 is installed and shows the exact release number.',
        example: 'python3 --version'
      }
    ],
    resources: [
      {
        title: 'Crash Course Computer Science (40 short videos)',
        url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo',
        type: 'Video',
        isFree: true,
        notes: 'Best high-level overview of how computers, transistors, CPUs, and software work.'
      },
      {
        title: 'Khan Academy: Algebra 1, Arithmetic, Logic & Computing',
        url: 'https://www.khanacademy.org/computing',
        type: 'Course',
        isFree: true,
        notes: 'Free. Focus on powers of 2, binary conversions, Boolean logic, and simple equations.'
      },
      {
        title: 'Code.org - How Computers Work',
        url: 'https://code.org/curriculum/how-computers-work',
        type: 'Video',
        isFree: true,
        notes: 'Accessible, animated explanations of logic gates, hardware, data, and internet circuits.'
      },
      {
        title: 'Nand2Tetris: Building a Modern Computer from First Principles',
        url: 'https://www.nand2tetris.org',
        type: 'Course',
        isFree: true,
        notes: 'Build a simulated computer model starting from elementary NAND gates all the way up to an operating system.'
      },
      {
        title: 'TypingClub',
        url: 'https://www.typingclub.com',
        type: 'Lab',
        isFree: true,
        notes: 'Practice touch typing daily to build terminal and coding muscle memory.'
      },
      {
        title: 'GitHub Hello World Guide',
        url: 'https://docs.github.com/en/get-started/start-your-journey/hello-world',
        type: 'Docs',
        isFree: true,
        notes: 'Official guide to repositories, commits, branches, and README files.'
      }
    ],
    practiceTask: {
      title: 'First Repository & Hello World',
      description: 'Create a learning folder with subdirectories (notes, exercises, projects), initialize Git, write a README.md, and run a tiny Python script.',
      deliverable: 'A clean GitHub repository with your first commit and a documented README explaining your 6-month goal.'
    },
    exitChecklist: [
      'I can convert small decimal numbers (0-255) to binary and hexadecimal by hand without a calculator.',
      'I can recite powers of two from 2^0=1 to 2^16=65,536 from memory.',
      'I understand Boolean AND, OR, NOT, and XOR operations and can draw their truth tables.',
      'I can explain what CPU, ALU, RAM, storage, operating system, and the internet mean.',
      'I can explain why byte overflow occurs when adding 1 to 255 in an unsigned 8-bit integer.',
      'I have installed Python 3, VS Code, and Git, and saved my first commit to a repository.'
    ],
    safetyWarning: 'Golden Privacy Rule: Never commit passwords, private keys, access tokens, home addresses, or personal credentials into public GitHub repositories.'
  },
  {
    id: 'stage-1',
    number: 1,
    title: 'Python: Beginner to Independent Scripts',
    subtitle: 'Learning computational thinking through readable code',
    timeEstimate: '6-8 weeks',
    sprintMonth: 'Month 1 & Month 2',
    goal: 'Write loops, functions, lists, dictionaries, error handlers, and file-parsing scripts without copying answers.',
    eli9Metaphor: 'Python is like writing a recipe in plain English that a robot follows line by line. Variables are labeled storage boxes, if-statements are fork roads, and loops are repeating steps until the cake is baked.',
    topics: [
      {
        id: 's1-t1',
        title: 'Basic Programming Concepts: Variables, Data Types & Memory',
        description: 'Variables are labeled references to memory addresses that store values during execution. Master primitive data types: integers (int), floating-point numbers (float), strings (str), and Booleans (bool). Understand dynamic vs static typing, memory footprints, and safe type conversion.',
        eli9: 'Variables are labeled boxes on a shelf. An integer box holds whole numbers (like 42), a float box holds decimals (like 3.14), and a string box holds letters!',
        codeSnippet: {
          language: 'python',
          explanation: 'Declaring variables, inspecting runtime types with type(), formatted f-strings, and safe type casting.',
          code: `# Variables, Types & Memory Inspector
student_name = "Kareem"       # str
student_age = 15              # int
gpa = 3.92                    # float
is_enrolled = True            # bool

print(f"Name: {student_name} | Type: {type(student_name).__name__}")
print(f"Age:  {student_age} | Type: {type(student_age).__name__}")
print(f"GPA:  {gpa} | Type: {type(gpa).__name__}")
print(f"Enrolled? {is_enrolled} | Type: {type(is_enrolled).__name__}")

# Explicit Type Conversion
raw_input_age = "16"
parsed_age = int(raw_input_age)
print(f"\\nParsed age + 1 year: {parsed_age + 1}")
`
        },
        externalLinks: [
          { title: 'Harvard CS50P: Variables & Types', url: 'https://cs50.harvard.edu/python/2022/weeks/0/', type: 'Course' },
          { title: 'Python Official Docs: Data Types', url: 'https://docs.python.org/3/library/stdtypes.html', type: 'Docs' },
          { title: 'W3Schools: Python Variables', url: 'https://www.w3schools.com/python/python_variables.asp', type: 'Article' }
        ]
      },
      {
        id: 's1-t2',
        title: 'Operators: Arithmetic, Comparison & Logical Operations',
        description: 'Operators perform mathematical and logical evaluations. Master arithmetic operators (+, -, *, /, // floor division, % modulo, ** power), comparison operators (==, !=, <, >, <=, >=), and logical operators (and, or, not). Understand operator precedence and short-circuit evaluation.',
        eli9: 'Operators are the tools in your math toolkit: + adds, % gives the remainder to check if numbers are even or odd, and \'and\' / \'or\' let your code make smart decisions!',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrating arithmetic precedence, modulo parity checks, and logical short-circuit evaluation.',
          code: `# Operators & Boolean Evaluation Demonstration
a = 17
b = 5

print("--- Arithmetic Operators ---")
print(f"Standard Division (a / b):   {a / b}")    # 3.4
print(f"Floor Division (a // b):     {a // b}")   # 3
print(f"Modulo Remainder (a % b):    {a % b}")    # 2 (Useful for parity/even-odd)
print(f"Exponentiation (b ** 3):      {b ** 3}")   # 125

print("\\n--- Comparison & Logical Operators ---")
is_even = (a % 2 == 0)
print(f"Is {a} even? {is_even}")

# Logical chaining and short-circuit
has_permission = True
account_active = True
can_access = has_permission and account_active and (a > 10)
print(f"Access granted? {can_access}")
`
        },
        externalLinks: [
          { title: 'Real Python: Operators & Expressions', url: 'https://realpython.com/python-operators-expressions/', type: 'Article' },
          { title: 'W3Schools: Python Operators', url: 'https://www.w3schools.com/python/python_operators.asp', type: 'Docs' }
        ]
      },
      {
        id: 's1-t3',
        title: 'Simple Control Flow: Conditional Branching (if / elif / else)',
        description: 'Construct conditional decision trees based on runtime boolean expressions. Learn if, elif, and else statements, truthy and falsy values (0, empty strings, empty lists evaluate to False), nested conditions, and guard clauses for clean code.',
        eli9: 'An if-statement is a fork in the road: IF you have a pass, enter; ELIF you have student ID, get a discount; ELSE purchase a ticket!',
        codeSnippet: {
          language: 'python',
          explanation: 'A clean grading and security clearance decision tree using guard clauses and if/elif/else.',
          code: `# Control Flow: Grade & Access Evaluation
def evaluate_score(score):
    # Guard clause: check invalid boundaries first
    if score < 0 or score > 100:
        return "Invalid Score (Must be 0-100)"
    
    # Decision hierarchy
    if score >= 90:
        return "A (Hero Honors)"
    elif score >= 80:
        return "B (Proficient)"
    elif score >= 70:
        return "C (Competent)"
    elif score >= 60:
        return "D (Needs Review)"
    else:
        return "F (Redo Module)"

for test_score in [95, 82, 73, 58, 105]:
    print(f"Score {test_score:3d} -> Result: {evaluate_score(test_score)}")
`
        },
        externalLinks: [
          { title: 'Harvard CS50P: Conditionals', url: 'https://cs50.harvard.edu/python/2022/weeks/1/', type: 'Course' },
          { title: 'Python Docs: More Control Flow', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements', type: 'Docs' }
        ]
      },
      {
        id: 's1-t4',
        title: 'Simple Control Flow: Iteration & Repetition (while & for Loops)',
        description: 'Automate repetitive chore work without copy-pasting code. Master while loops (condition-driven iteration), for-in loops (sequence-driven iteration with range()), loop accumulators, and control statements (break to exit early, continue to skip to the next iteration).',
        eli9: 'Loops repeat chores automatically: instead of writing "print number" 100 times, a for loop repeats the action in 2 lines!',
        codeSnippet: {
          language: 'python',
          explanation: 'Comparing while loops and for-range loops with break and continue statements.',
          code: `# Iteration: For Loops & While Loops
print("--- 1. For Loop with range() Accumulator ---")
total_sum = 0
for n in range(1, 11): # 1 to 10
    total_sum += n
print(f"Sum of 1 to 10: {total_sum}")

print("\\n--- 2. While Loop: Binary Halving Countdown ---")
count = 64
steps = 0
while count > 1:
    count //= 2
    steps += 1
    print(f"Step {steps}: value is now {count}")

print("\\n--- 3. Loop Control: Break & Continue ---")
print("Filtering even numbers under 10 (skipping odd with continue):")
for i in range(1, 10):
    if i % 2 != 0:
        continue # Skip odd numbers
    if i > 6:
        print(f"  Reached limit ({i}), breaking early!")
        break
    print(f"  Found even number: {i}")
`
        },
        externalLinks: [
          { title: 'Harvard CS50P: Loops', url: 'https://cs50.harvard.edu/python/2022/weeks/2/', type: 'Course' },
          { title: 'Real Python: For Loops in Python', url: 'https://realpython.com/python-for-loop/', type: 'Article' }
        ]
      },
      {
        id: 's1-t5',
        title: 'Functions, Parameters, Return Values & Scope',
        description: 'Decompose complex problems into small, reusable functions with explicit inputs and return values using def. Understand positional arguments, default values, docstrings, and local vs global variable scope.',
        eli9: 'A function is like a vending machine: you pass in coins (arguments), it executes instructions inside, and returns a cold drink (return value)!',
        codeSnippet: {
          language: 'python',
          explanation: 'Defining pure functions with type hints, docstrings, default arguments, and multi-return tuples.',
          code: `# Functions & Local Scope
def calculate_rectangle(width: float, height: float = 1.0):
    """Calculates the area and perimeter of a rectangle."""
    area = width * height
    perimeter = 2 * (width + height)
    return area, perimeter # Returns a tuple

# Calling function with positional and default arguments
rect_area, rect_perim = calculate_rectangle(5.0, 3.0)
print(f"Rectangle (5x3) -> Area: {rect_area}, Perimeter: {rect_perim}")

square_area, square_perim = calculate_rectangle(4.0) # Uses default height=1.0
print(f"Rectangle (4x1) -> Area: {square_area}, Perimeter: {square_perim}")
`
        },
        externalLinks: [
          { title: 'Harvard CS50P: Functions', url: 'https://cs50.harvard.edu/python/2022/weeks/0/', type: 'Course' },
          { title: 'Python Docs: Defining Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', type: 'Docs' }
        ]
      },
      {
        id: 's1-t6',
        title: 'Collections: Lists, Tuples, Dictionaries & Sets',
        description: 'Store and manipulate structured data in memory. Lists for ordered mutable sequences; Dictionaries for fast key-value lookups in O(1) time; Sets for mathematical deduplication; Tuples for immutable records.',
        eli9: 'A list is a numbered shopping list; a dictionary is like a contact list where a person’s name gets you their phone number.',
        codeSnippet: {
          language: 'python',
          explanation: 'Demonstrating lists, dictionaries with key-value iteration, and set deduplication.',
          code: `# Collections: Lists, Dicts & Sets
languages = ["Python", "C", "SQL", "Bash"]
languages.append("Go")
print(f"Languages list: {languages} (Length: {len(languages)})")

# Key-Value Dictionary Lookup
student_profiles = {
    "s001": {"name": "Alex", "stage": 0, "xp": 150},
    "s002": {"name": "Kareem", "stage": 1, "xp": 350}
}
print(f"Student s002 name: {student_profiles['s002']['name']}")

# Set Deduplication
raw_ips = ["192.168.1.1", "10.0.0.1", "192.168.1.1", "172.16.0.5"]
unique_ips = set(raw_ips)
print(f"Raw IPs: {len(raw_ips)} -> Unique IPs: {unique_ips}")
`
        },
        externalLinks: [
          { title: 'Real Python: Python Dictionaries', url: 'https://realpython.com/python-dicts/', type: 'Article' },
          { title: 'Python Docs: Data Structures', url: 'https://docs.python.org/3/tutorial/datastructures.html', type: 'Docs' }
        ]
      },
      {
        id: 's1-t7',
        title: 'Defensive Programming: Files & Exceptions (try/except)',
        description: 'Read and write text, CSV, and JSON files safely using context managers (with open(...)) while gracefully catching FileNotFoundError and ValueError without crashing.',
        eli9: 'Exception handling is wearing a seatbelt: if the code encounters an error, try/except stops the program from exploding.',
        codeSnippet: {
          language: 'python',
          explanation: 'Safe file parsing and exception handling with try/except/finally.',
          code: `# Robust Exception Handling & Defensive File I/O
def safe_parse_integer(text_val):
    try:
        val = int(text_val)
        return val, "OK"
    except ValueError as e:
        return None, f"Parsing Error: '{text_val}' is not a valid integer"

test_inputs = ["42", "100", "invalid_num", "3.14"]
for item in test_inputs:
    result, status = safe_parse_integer(item)
    print(f"Input: {item:12s} -> Output: {result} ({status})")
`
        },
        externalLinks: [
          { title: 'Real Python: Python Exceptions Guide', url: 'https://realpython.com/python-exceptions/', type: 'Article' },
          { title: 'Harvard CS50P: Exceptions', url: 'https://cs50.harvard.edu/python/2022/weeks/3/', type: 'Course' }
        ]
      }
    ],
    commands: [
      {
        name: 'python script.py',
        syntax: 'python3 script.py',
        category: 'Linux',
        explanation: 'Executes the Python program using the Python 3 interpreter.',
        example: 'python3 quiz.py'
      },
      {
        name: 'pip install',
        syntax: 'pip install <package>',
        category: 'Linux',
        explanation: 'Installs third-party packages from PyPI inside your virtual environment.',
        example: 'pip install pytest'
      },
      {
        name: 'python -m venv',
        syntax: 'python3 -m venv .venv && source .venv/bin/activate',
        category: 'Linux',
        explanation: 'Creates and activates an isolated Python virtual environment for safe dependency management.',
        example: 'python3 -m venv .venv'
      }
    ],
    resources: [
      {
        title: 'Harvard CS50P - Introduction to Programming with Python',
        url: 'https://cs50.harvard.edu/python',
        type: 'Course',
        isFree: true,
        notes: 'Harvard’s free structured Python course with hands-on problem sets and automatic grading.'
      },
      {
        title: 'Automate the Boring Stuff with Python (Al Sweigart)',
        url: 'https://automatetheboringstuff.com',
        type: 'Book',
        isFree: true,
        notes: 'Practical online book teaching scripts for file searching, regex, and spreadsheet handling.'
      },
      {
        title: 'Exercism Python Track',
        url: 'https://exercism.org/tracks/python',
        type: 'Lab',
        isFree: true,
        notes: 'Practice coding challenges with automated unit tests and friendly mentor feedback.'
      },
      {
        title: 'Official Python 3 Documentation',
        url: 'https://docs.python.org/3/tutorial/',
        type: 'Docs',
        isFree: true,
        notes: 'The definitive reference guide for standard library modules and syntax.'
      }
    ],
    practiceTask: {
      title: 'Password Strength & Log Analyzer Mini-Projects',
      description: 'Build 3 independent scripts: (1) A multiple-choice quiz app, (2) A password policy strength evaluator, (3) A synthetic log analyzer that parses CSV lines.',
      deliverable: 'Tested Python scripts published to GitHub with unit tests and clear usage instructions.'
    },
    exitChecklist: [
      'I can write loops, functions, lists, and file-handling programs without copying.',
      'I understand the difference between a list (ordered) and a dictionary (key-value lookup).',
      'I can handle unexpected errors using try/except blocks without crashing.',
      'I wrote tests for boundary conditions (empty inputs, negative numbers, missing files).'
    ],
    safetyWarning: 'Never run Python scripts from unknown internet sources without inspecting every line first.'
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Computer Science Foundations & Digital Logic',
    subtitle: 'The "why" beneath transistors, gates, and binary logic',
    timeEstimate: '3-4 weeks',
    sprintMonth: 'Month 2 & Month 3',
    goal: 'Understand logic gates (AND, OR, XOR, NOT), binary, hexadecimal, ASCII/Unicode, CPU architecture, and basic algorithm complexity.',
    eli9Metaphor: 'Computers do not understand letters or colors; they only have billions of microscopic light switches that are either ON (1) or OFF (0). By combining these switches in clever patterns called gates, computers can do math and remember everything.',
    topics: [
      {
        id: 's2-t1',
        title: 'Bits, Bytes & Powers of 2',
        description: 'Understand 2^0 through 2^16, why 8 bits make a byte, and convert between binary, decimal, and hexadecimal.',
        eli9: 'Binary counts in powers of 2 (1, 2, 4, 8, 16, 32...) just like decimal counts in powers of 10.'
      },
      {
        id: 's2-t2',
        title: 'Logic Gates & Truth Tables',
        description: 'Model AND, OR, NOT, XOR, NAND gates. Construct half-adders and full-adders from logic gates.',
        eli9: 'An AND gate is like two light switches in a row: light only turns on if BOTH switches are flipped.'
      },
      {
        id: 's2-t3',
        title: 'CPU, ALU & The Fetch-Execute Cycle',
        description: 'Trace how instructions move from RAM into registers, through the Arithmetic Logic Unit, and update program state.',
        eli9: 'The CPU reads an instruction, decodes what it means, does the math, and saves the answer in a loop millions of times per second.'
      },
      {
        id: 's2-t4',
        title: 'Algorithms & Big-O Intuition',
        description: 'Compare linear search O(N) with binary search O(log N). Understand why nested loops O(N^2) slow down large datasets.',
        eli9: 'Looking through a dictionary page-by-page is O(N). Splitting the book in half repeatedly to find a word is O(log N).'
      }
    ],
    commands: [
      {
        name: 'xxd / hexdump',
        syntax: 'xxd filename.bin',
        category: 'Linux',
        explanation: 'Creates a hex dump of a file, showing exact raw bytes side-by-side with ASCII representations.',
        example: 'xxd -l 64 /bin/ls'
      },
      {
        name: 'bc (binary calculator)',
        syntax: 'echo "obase=2; 42" | bc',
        category: 'Linux',
        explanation: 'Converts decimal numbers into binary directly from the Linux command line.',
        example: 'echo "obase=16; 255" | bc'
      }
    ],
    resources: [
      {
        title: 'Nand2Tetris (Build a Computer from First Principles)',
        url: 'https://www.nand2tetris.org',
        type: 'Course',
        isFree: true,
        notes: 'Legendary free course where you build a functioning virtual computer starting from a single NAND gate.'
      },
      {
        title: 'Neso Academy - Digital Electronics Playlist',
        url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm',
        type: 'Video',
        isFree: true,
        notes: 'Crystal-clear classroom lectures explaining gates, boolean algebra, multiplexers, and flip-flops.'
      },
      {
        title: 'Code: The Hidden Language of Computer Hardware (Charles Petzold)',
        url: 'https://www.charlespetzold.com/code/',
        type: 'Book',
        isFree: false,
        costNote: 'Available in public libraries and bookstores',
        notes: 'The single best book for beginners explaining how flashlights, relays, and codes turn into computers.'
      },
      {
        title: 'VisuAlgo - Data Structure & Algorithm Visualizer',
        url: 'https://visualgo.net',
        type: 'Tool',
        isFree: true,
        notes: 'Interactive animations of sorting, trees, search algorithms, and hash tables.'
      }
    ],
    practiceTask: {
      title: 'Digital Circuit Simulation & Binary Converter',
      description: 'Convert 10 binary and hexadecimal values by hand. Draw an adder circuit in Logisim or our interactive Bit Flipper.',
      deliverable: 'A written note explaining how a CPU adds two numbers using logic gates.'
    },
    exitChecklist: [
      'I can convert decimal numbers (e.g. 42, 255) into binary and hex by hand.',
      'I can write truth tables for AND, OR, XOR, and NOT gates without looking.',
      'I can explain the difference between RAM (fast, volatile) and Storage (slower, persistent).',
      'I understand why binary search is vastly faster than checking every item one by one.'
    ],
    safetyWarning: 'Practice conversions on paper first before checking answers with online calculators.'
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Git, Linux & Operating Systems',
    subtitle: 'Mastering the command line and server fundamentals',
    timeEstimate: '3-4 weeks',
    sprintMonth: 'Month 3',
    goal: 'Navigate the terminal without a GUI, manage files, permissions, users, processes, text search, pipes, and solve OverTheWire Bandit levels.',
    eli9Metaphor: 'Using a mouse on a desktop is like walking through a mall. Using the Linux terminal is like having teleportation and superpowers: one typed command can find, rename, and sort 10,000 files in under one second.',
    topics: [
      {
        id: 's3-t1',
        title: 'Terminal Navigation & File Inspection',
        description: 'Navigate hierarchies with pwd, ls, cd, mkdir, cp, mv, rm, cat, less, head, tail.',
        eli9: 'pwd tells you where you are standing; ls shows what is around you; cd lets you walk into a new room.'
      },
      {
        id: 's3-t2',
        title: 'Text Processing: grep, find, sort, uniq, wc',
        description: 'Filter massive log files using regular expressions, text stream sorting, counting words and lines.',
        eli9: 'grep is like a search bar that instantly pulls out every line containing a specific word.'
      },
      {
        id: 's3-t3',
        title: 'Linux Permissions (rwx, chmod, chown)',
        description: 'Understand Read (4), Write (2), Execute (1) permissions across User, Group, and Others. Principle of least privilege.',
        eli9: 'Permissions are like door locks with keys for the owner, their team, and random guests.'
      },
      {
        id: 's3-t4',
        title: 'Pipes (|) and Redirection (>, >>, <)',
        description: 'Chain multiple small modular Linux utilities together to build powerful data processing pipelines.',
        eli9: 'A pipe connects the output of one tool into the mouth of the next tool like an assembly line.'
      },
      {
        id: 's3-t5',
        title: 'Processes, Signals & Job Control',
        description: 'Monitor running tasks with ps, top, htop. Send signals (SIGINT, SIGTERM, SIGKILL) with kill.',
        eli9: 'Processes are active programs running in memory. top is your computer’s heart rate monitor.'
      },
      {
        id: 's3-t6',
        title: 'OverTheWire Bandit Wargame',
        description: 'Solve Levels 0 through 15+ to learn password retrieval, hidden files, gzip compression, rot13, and SSH keys.',
        eli9: 'Bandit is a cybersecurity video game where each level teaches you a real Linux hacker skill to unlock the next password.'
      }
    ],
    commands: [
      {
        name: 'ls -la',
        syntax: 'ls -la',
        category: 'Linux',
        explanation: 'Lists all files in detailed format, including hidden dotfiles and permission strings.',
        example: 'ls -la /var/log'
      },
      {
        name: 'grep',
        syntax: 'grep -rn "search_term" /path/to/search',
        category: 'Linux',
        explanation: 'Recursively searches for text strings within files and reports line numbers.',
        example: 'grep -i "failed password" /var/log/auth.log'
      },
      {
        name: 'chmod',
        syntax: 'chmod 755 script.sh',
        category: 'Linux',
        explanation: 'Changes file permissions (755 = rwxr-xr-x: owner can read/write/execute, others can read/execute).',
        example: 'chmod 600 id_rsa'
      },
      {
        name: 'ssh',
        syntax: 'ssh -p 2220 bandit0@bandit.labs.overthewire.org',
        category: 'Linux',
        explanation: 'Opens a secure shell remote encrypted session to a remote server on a specified port.',
        example: 'ssh -p 2220 bandit0@bandit.labs.overthewire.org'
      },
      {
        name: 'tar / gzip',
        syntax: 'tar -czvf archive.tar.gz folder/',
        category: 'Linux',
        explanation: 'Creates a compressed tape archive of a directory.',
        example: 'tar -xzvf backup.tar.gz'
      }
    ],
    resources: [
      {
        title: 'Linux Journey',
        url: 'https://linuxjourney.com',
        type: 'Course',
        isFree: true,
        notes: 'Beautiful free, interactive step-by-step beginner guide to the Linux terminal, command line, and OS.'
      },
      {
        title: 'OverTheWire: Bandit Wargame',
        url: 'https://overthewire.org/wargames/bandit/',
        type: 'Lab',
        isFree: true,
        notes: 'The golden standard wargame for learning Linux terminal commands from absolute scratch.'
      },
      {
        title: 'The Linux Command Line (William Shotts)',
        url: 'https://linuxcommand.org/tlcl.php',
        type: 'Book',
        isFree: true,
        notes: 'Comprehensive free legal PDF book covering every essential shell command and bash scripting.'
      },
      {
        title: 'VirtualBox & Ubuntu Desktop/Server',
        url: 'https://www.virtualbox.org',
        type: 'Tool',
        isFree: true,
        notes: 'Free virtualization hypervisor for running a private, safe Ubuntu Linux sandbox VM on your PC.'
      }
    ],
    practiceTask: {
      title: 'Bandit Levels 0 to 15 & Shell Log Filter',
      description: 'Complete Bandit levels 0 to 15 while keeping clean documentation notes. Write a harmless 10-line bash script that filters an Apache log file.',
      deliverable: 'Documented Bandit solution logbook and a working bash script with pipes and grep.'
    },
    exitChecklist: [
      'I can navigate directories, edit files with nano/vim, and view hidden files comfortably.',
      'I understand chmod numbers (600, 644, 755) and what r, w, and x mean.',
      'I can combine commands using pipes (|) to sort and count occurrences in a file.',
      'I solved at least 10 levels of OverTheWire Bandit independently.'
    ],
    safetyWarning: 'Never run sudo commands from unknown web tutorials. Always understand what a command does before pressing Enter.'
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Networking Fundamentals & Web Protocols',
    subtitle: 'The highway system of the internet (The most important stage)',
    timeEstimate: '6-8 weeks',
    sprintMonth: 'Month 4',
    goal: 'Understand how data packets travel across the world, subnet IPv4 by hand, inspect packets in Wireshark, and trace DNS, TCP, and TLS handshakes.',
    eli9Metaphor: 'The internet is the international postal service. An IP address is your house address, a MAC address is your physical fingerprint, a port is the specific apartment door, and packets are envelopes traveling across postal trucks (routers).',
    topics: [
      {
        id: 's4-t1',
        title: 'The OSI Model & TCP/IP Stack',
        description: 'Understand the 7 layers vs 4 layers: Physical, Data Link (Ethernet/MAC), Network (IP), Transport (TCP/UDP), Application (HTTP/DNS).',
        eli9: 'Like Russian nesting dolls, each layer wraps your message inside another protective envelope before sending it.'
      },
      {
        id: 's4-t2',
        title: 'IPv4 Addressing & Subnetting by Hand',
        description: 'Private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), CIDR notation (/24, /28), subnet masks, network and broadcast addresses.',
        eli9: 'Subnetting is like dividing a big school building into private classrooms so students do not scream over each other.'
      },
      {
        id: 's4-t3',
        title: 'TCP vs UDP & Port Numbers',
        description: 'TCP 3-way handshake (SYN, SYN-ACK, ACK), reliable delivery, sequence numbers vs UDP connectionless speed (DNS, streaming, games).',
        eli9: 'TCP is a registered certified letter that requires a signature; UDP is like throwing a paper airplane.'
      },
      {
        id: 's4-t4',
        title: 'Core Infrastructure Services: DNS, DHCP & ARP',
        description: 'How domain names resolve to IPs; how devices lease IP addresses on boot; how IP addresses map to hardware MAC addresses.',
        eli9: 'DNS is the internet’s contact book, converting names like google.com into phone numbers like 142.250.190.46.'
      },
      {
        id: 's4-t5',
        title: 'HTTP, HTTPS & TLS Certificates',
        description: 'HTTP request methods (GET, POST), headers, status codes (200, 301, 404, 500), asymmetric encryption, certificates, and CAs.',
        eli9: 'HTTPS puts your message inside a locked metal case that only the bank server has the key to open.'
      },
      {
        id: 's4-t6',
        title: 'Packet Analysis with Wireshark',
        description: 'Capture local traffic, apply display filters (tcp.port == 80, dns, http), follow TCP streams, and analyze packet headers.',
        eli9: 'Wireshark is an X-ray machine that lets you see the exact envelopes passing through your computer’s network cable.'
      }
    ],
    commands: [
      {
        name: 'ping / traceroute',
        syntax: 'ping -c 4 8.8.8.8 && traceroute 8.8.8.8',
        category: 'Networking',
        explanation: 'Tests network reachability using ICMP echo requests and traces every router hop along the route.',
        example: 'ping -c 4 1.1.1.1'
      },
      {
        name: 'dig / nslookup',
        syntax: 'dig example.com A +short',
        category: 'Networking',
        explanation: 'Queries DNS servers for domain name records (A, AAAA, MX, TXT).',
        example: 'dig google.com'
      },
      {
        name: 'netstat / ss',
        syntax: 'ss -tuln',
        category: 'Networking',
        explanation: 'Displays all active listening TCP and UDP ports and sockets on your local system.',
        example: 'ss -tuln'
      },
      {
        name: 'curl',
        syntax: 'curl -I https://example.com',
        category: 'Networking',
        explanation: 'Fetches HTTP response headers from a web server without downloading the full body.',
        example: 'curl -I https://httpbin.org/get'
      }
    ],
    resources: [
      {
        title: 'Cisco Networking Academy (Networking Basics / Essentials)',
        url: 'https://www.netacad.com',
        type: 'Course',
        isFree: true,
        notes: 'Comprehensive free online courses from Cisco, includes the Cisco Packet Tracer network simulation software.'
      },
      {
        title: 'Professor Messer - CompTIA Network+ Full Course',
        url: 'https://www.professormesser.com',
        type: 'Video',
        isFree: true,
        notes: 'Complete modular free video course breaking down every networking protocol and cable type.'
      },
      {
        title: 'Computer Networking: A Top-Down Approach (Kurose & Ross)',
        url: 'https://www.pearson.com',
        type: 'Book',
        isFree: false,
        costNote: 'Standard university textbook (available in school libraries)',
        notes: 'The undisputed gold standard textbook used in top university computer science degree programs.'
      },
      {
        title: 'Wireshark Official User Guide & Downloads',
        url: 'https://www.wireshark.org',
        type: 'Tool',
        isFree: true,
        notes: 'The industry-standard free packet analyzer for capturing and inspecting protocol traffic.'
      }
    ],
    practiceTask: {
      title: 'Packet Tracer Topology & Wireshark Capture Report',
      description: 'Design a virtual 2-subnet network with a router and DNS server in Packet Tracer. Capture your own HTTP vs HTTPS visit in Wireshark and write a report.',
      deliverable: 'A network diagram and a packet capture write-up explaining DNS lookups and the TCP handshake.'
    },
    exitChecklist: [
      'I can subnet an IPv4 /24 network into smaller subnets by hand without a calculator.',
      'I can explain what happens step-by-step from the moment I type a URL into a browser until the page renders.',
      'I can distinguish TCP from UDP and know the default ports for HTTP (80), HTTPS (443), SSH (22), DNS (53).',
      'I captured and filtered packets in Wireshark without looking at a tutorial.'
    ],
    safetyWarning: 'Only capture packet traffic on your own personal device or authorized lab network. Never capture traffic on public Wi-Fi or school networks.'
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Web Basics & SQL Databases',
    subtitle: 'Building and querying the applications that power the web',
    timeEstimate: '4-6 weeks',
    sprintMonth: 'Month 4 & Month 5',
    goal: 'Understand HTML/CSS/JavaScript structure, browser request cycles, relational database tables, SQL queries, and safe parameterized query practices.',
    eli9Metaphor: 'A website is like a restaurant. HTML is the walls and tables; CSS is the interior decoration; JavaScript is the lively waiter; and the SQL database is the organized kitchen pantry where every ingredient is stored in labeled jars.',
    topics: [
      {
        id: 's5-t1',
        title: 'HTML5, CSS & JavaScript Fundamentals',
        description: 'DOM hierarchy, forms, input fields, client-side validation, HTTP request submissions, and browser DevTools.',
        eli9: 'HTML gives a web page bones, CSS gives it skin and clothes, JavaScript gives it muscles to move.'
      },
      {
        id: 's5-t2',
        title: 'Relational Database Schema & Keys',
        description: 'Tables, rows, columns, Primary Keys, Foreign Keys, one-to-many relationships, constraints, and data integrity.',
        eli9: 'A primary key is like a student ID number: unique to each person so records never get mixed up.'
      },
      {
        id: 's5-t3',
        title: 'Core SQL Queries: SELECT, WHERE, JOIN',
        description: 'Querying data, filtering with WHERE, ordering, aggregating with COUNT/SUM/GROUP BY, and combining tables with INNER/LEFT JOIN.',
        eli9: 'A JOIN is like matching puzzle pieces from two different spreadsheets based on a shared column.'
      },
      {
        id: 's5-t4',
        title: 'SQL Injection Concepts & Parameterized Queries',
        description: 'Understand how string concatenation leads to SQL injection, and why prepared statements with parameters guarantee security.',
        eli9: 'Never glue user text directly into your SQL instructions; use placeholder slots so the database treats input as raw data, not code.'
      }
    ],
    commands: [
      {
        name: 'sqlite3',
        syntax: 'sqlite3 events.db',
        category: 'SQL',
        explanation: 'Opens or creates a lightweight zero-configuration SQLite database file directly in the terminal.',
        example: 'sqlite3 security_logs.db'
      },
      {
        name: 'SELECT ... JOIN',
        syntax: 'SELECT users.name, logs.event FROM users JOIN logs ON users.id = logs.user_id WHERE logs.severity = "HIGH";',
        category: 'SQL',
        explanation: 'Queries and combines rows from two related tables based on a foreign key relationship.',
        example: 'SELECT * FROM assets WHERE ip LIKE "192.168.%" ORDER BY created_at DESC;'
      }
    ],
    resources: [
      {
        title: 'SQLBolt - Interactive SQL Lessons',
        url: 'https://sqlbolt.com',
        type: 'Lab',
        isFree: true,
        notes: 'Interactive, browser-based hands-on exercises for learning SELECT, JOINs, aggregations, and table management.'
      },
      {
        title: 'MDN Learn Web Development',
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        type: 'Docs',
        isFree: true,
        notes: 'The industry-standard documentation explaining HTML, CSS, JavaScript, and HTTP request flows.'
      },
      {
        title: 'OWASP SQL Injection Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
        type: 'Docs',
        isFree: true,
        notes: 'Definitive guide on why parameterized queries and prepared statements prevent database tampering.'
      }
    ],
    practiceTask: {
      title: 'Security Event SQLite Database',
      description: 'Create a SQLite relational database storing synthetic users, devices, and security events. Write parameterized queries to search by severity and date.',
      deliverable: 'A documented SQL schema with sample synthetic data, queries, and a Python script using sqlite3 parameterized queries.'
    },
    exitChecklist: [
      'I can explain the difference between a primary key and a foreign key.',
      'I can write an INNER JOIN and GROUP BY query from memory.',
      'I can demonstrate why parameterized queries prevent SQL injection attacks.',
      'I can inspect HTTP requests, headers, and status codes using Chrome/Firefox Developer Tools.'
    ],
    safetyWarning: 'Never test SQL injection strings against real websites. Practice only on synthetic local SQLite files or PortSwigger labs.'
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'C Programming & Memory Foundations',
    subtitle: 'Lifting the hood on compiled native code and pointers',
    timeEstimate: '6-8 weeks',
    sprintMonth: 'Month 5',
    goal: 'Understand compilation, pointers, memory addresses, structs, manual allocation/free, stack vs heap, and safe string handling.',
    eli9Metaphor: 'In Python, the computer is like an automatic car with power steering and seatbelts. In C, you are building the engine by hand: you control every drop of gasoline and every wire. If you forget to release memory, your car leaks oil.',
    topics: [
      {
        id: 's6-t1',
        title: 'Compilation & Linking (GCC / Clang)',
        description: 'From source code (.c) $\to$ Preprocessor $\to$ Compiler $\to$ Assembler $\to$ Linker $\to$ ELF binary executable.',
        eli9: 'The compiler translates your human-readable C text into raw binary machine code that your CPU chip executes.'
      },
      {
        id: 's6-t2',
        title: 'Pointers & Memory Addresses (& and *)',
        description: 'Memory as a giant array of bytes. Pointer variables holding memory addresses. Dereferencing values.',
        eli9: 'A variable holds a value. A pointer holds the house address of where that variable lives.'
      },
      {
        id: 's6-t3',
        title: 'Arrays, C-Strings & Null Terminators',
        description: 'Why arrays are contiguous memory blocks. C-strings as char arrays ending in \\0. Why forgetting \\0 causes buffer overflows.',
        eli9: 'A C string is a row of letters on a shelf that ends with a stop sign (\\0). If the stop sign is missing, the reader keeps reading random memory.'
      },
      {
        id: 's6-t4',
        title: 'Stack vs Heap (malloc and free)',
        description: 'Automatic stack variables tied to function scope vs dynamic heap allocations requiring explicit free() calls. Memory leaks.',
        eli9: 'The stack is a stack of plates: fast and clean. The heap is an open field where you can set up a tent, but you must take it down when done.'
      },
      {
        id: 's6-t5',
        title: 'Memory Safety Vulnerabilities (Defensive Study)',
        description: 'Understand buffer overflows, out-of-bounds access, off-by-one errors, and how compiler warnings and AddressSanitizer catch bugs.',
        eli9: 'Buffer overflow is trying to pour a gallon of water into a coffee mug—the extra water spills over and ruins adjacent papers.'
      }
    ],
    commands: [
      {
        name: 'gcc compile',
        syntax: 'gcc -Wall -Wextra -pedantic -g program.c -o program',
        category: 'C/C++',
        explanation: 'Compiles C code with all warning flags enabled and debug symbols (-g) for GDB analysis.',
        example: 'gcc -Wall -g log_parser.c -o log_parser'
      },
      {
        name: 'AddressSanitizer (ASan)',
        syntax: 'gcc -fsanitize=address -g program.c -o program_asan',
        category: 'C/C++',
        explanation: 'Instruments binary to catch buffer overflows, memory leaks, and use-after-free bugs at runtime.',
        example: 'gcc -fsanitize=address -g test.c -o test_asan'
      },
      {
        name: 'valgrind',
        syntax: 'valgrind --leak-check=full ./program',
        category: 'C/C++',
        explanation: 'Inspects heap allocations and reports memory leaks and uninitialized reads.',
        example: 'valgrind ./log_parser sample.log'
      }
    ],
    resources: [
      {
        title: 'Harvard CS50x - Weeks 1 through 5 (C & Memory)',
        url: 'https://cs50.harvard.edu/x',
        type: 'Course',
        isFree: true,
        notes: 'Harvard’s premier computer science course covering C, pointers, memory allocation, and data structures.'
      },
      {
        title: 'Learn-C.org',
        url: 'https://www.learn-c.org',
        type: 'Lab',
        isFree: true,
        notes: 'Short, clean browser-based lessons reviewing C syntax, pointers, structs, and dynamic memory.'
      },
      {
        title: 'Hacking: The Art of Exploitation (Jon Erickson)',
        url: 'https://nostarch.com/hacking2.htm',
        type: 'Book',
        isFree: false,
        costNote: 'Available in public libraries and bookstores',
        notes: 'Classic systems book teaching C programming, memory architecture, and debugging fundamentals.'
      }
    ],
    practiceTask: {
      title: 'Memory-Safe C File Parser',
      description: 'Write a C program that reads a synthetic log file, validates input lengths, handles malformed lines safely, and frees all allocated memory.',
      deliverable: 'A tested C program that compiles cleanly with -Wall -Wextra and runs with zero memory leaks in Valgrind.'
    },
    exitChecklist: [
      'I can compile a C program from source using GCC with warnings enabled.',
      'I can explain the difference between an array and a pointer.',
      'I understand stack frames and why returning a pointer to a local stack variable is an error.',
      'I can use AddressSanitizer or Valgrind to verify that my code has zero memory leaks.'
    ],
    safetyWarning: 'Practice memory-safe coding strictly on your own toy programs. Never attempt to use memory bugs against external applications.'
  },
  {
    id: 'stage-7',
    number: 7,
    title: 'Modern C++: Systems & RAII',
    subtitle: 'High-performance software with type safety and automatic memory management',
    timeEstimate: '6-10 weeks',
    sprintMonth: 'Month 5 & Month 6',
    goal: 'Master modern C++ (C++17/C++20), RAII, std::vector, std::string, smart pointers (std::unique_ptr), classes, and multi-file projects.',
    eli9Metaphor: 'C++ takes the raw engine power of C and adds automatic robotic mechanics. Instead of manually cleaning up every screw (free), RAII ensures that when an object leaves the room, its cleanup robot instantly cleans up.',
    topics: [
      {
        id: 's7-t1',
        title: 'Modern C++ vs C & Standard Library',
        description: 'Why modern C++ avoids owning raw pointers. Using std::string, std::vector, std::unordered_map, and range-based for loops.',
        eli9: 'std::vector is a smart list that grows and shrinks automatically without you having to calculate byte sizes.'
      },
      {
        id: 's7-t2',
        title: 'RAII (Resource Acquisition Is Initialization)',
        description: 'Resource management tied to object lifetime and stack scope. Destructors run automatically when leaving scope.',
        eli9: 'RAII is like an automatic door that closes itself the second you walk out of the room.'
      },
      {
        id: 's7-t3',
        title: 'Smart Pointers: std::unique_ptr & std::shared_ptr',
        description: 'Expressing exclusive vs shared ownership. Eliminating double-free and memory leak vulnerabilities.',
        eli9: 'A unique_ptr owns a toy exclusively. When the owner leaves, the toy is put away automatically.'
      },
      {
        id: 's7-t4',
        title: 'Classes, Encapsulation & Exceptions',
        description: 'Designing robust systems classes, const-correctness, separation of headers (.hpp) and implementation (.cpp).',
        eli9: 'Encapsulation is hiding complex internal machinery behind clean, safe buttons that users cannot misuse.'
      }
    ],
    commands: [
      {
        name: 'g++ compile',
        syntax: 'g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o app',
        category: 'C/C++',
        explanation: 'Compiles modern C++17 code with optimization and full warnings.',
        example: 'g++ -std=c++17 main.cpp log_summarizer.cpp -o summarizer'
      }
    ],
    resources: [
      {
        title: 'LearnCpp.com',
        url: 'https://www.learncpp.com',
        type: 'Course',
        isFree: true,
        notes: 'The single highest-rated free step-by-step tutorial series for learning modern C++ from scratch.'
      },
      {
        title: 'cppreference.com',
        url: 'https://en.cppreference.com',
        type: 'Docs',
        isFree: true,
        notes: 'The definitive encyclopedia for C++ syntax, containers, algorithms, and standard library reference.'
      }
    ],
    practiceTask: {
      title: 'Modern C++ Log Summarizer Tool',
      description: 'Build a multi-file C++ project using std::string, std::vector, and std::map to parse, group, and summarize synthetic server log entries.',
      deliverable: 'A structured C++ project with header files, clean RAII memory management, and build instructions.'
    },
    exitChecklist: [
      'I can explain the principle of RAII and why it prevents memory leaks.',
      'I know when to use std::vector vs std::map.',
      'I can compile a multi-file C++ project cleanly.',
      'I avoid using owning raw pointers or manual new/delete in modern code.'
    ],
    safetyWarning: 'Always prefer standard containers and smart pointers over raw C-style memory allocations.'
  },
  {
    id: 'stage-8',
    number: 8,
    title: 'Go (Golang): CLI Tools & Microservices',
    subtitle: 'The modern language of cloud infrastructure and high-speed network tools',
    timeEstimate: '4-8 weeks',
    sprintMonth: 'Month 6',
    goal: 'Build reliable command-line utilities and HTTP JSON APIs with Go, explicit error handling, timeouts, and clean module structures.',
    eli9Metaphor: 'Go is like building with high-tech snap-together LEGO bricks. It compiles into a single executable file that runs anywhere, has built-in web servers, and handles errors with crystal-clear honesty.',
    topics: [
      {
        id: 's8-t1',
        title: 'Go Basics, Packages & go.mod',
        description: 'Installation, go run/build/test, package management, explicit error checking (if err != nil).',
        eli9: 'Go insists that you handle every error immediately so your program never silently fails.'
      },
      {
        id: 's8-t2',
        title: 'Structs, Slices, Maps & Interfaces',
        description: 'Typed data structures, slice manipulation, JSON struct tags for serialization and deserialization.',
        eli9: 'Struct tags tell Go how to convert Go code into JSON for websites and web servers.'
      },
      {
        id: 's8-t3',
        title: 'HTTP Servers, Clients & Context Timeouts',
        description: 'Building REST endpoints using net/http, validating request bodies, setting read/write deadlines, binding to 127.0.0.1.',
        eli9: 'Timeouts ensure your server never hangs forever waiting on a slow or broken internet connection.'
      }
    ],
    commands: [
      {
        name: 'go run / go build',
        syntax: 'go run main.go && go build -o mytool',
        category: 'Dev',
        explanation: 'Compiles and runs or builds a self-contained static executable binary.',
        example: 'go build -o api_server main.go'
      },
      {
        name: 'go test',
        syntax: 'go test -v ./...',
        category: 'Dev',
        explanation: 'Runs all unit tests across all packages in the Go module.',
        example: 'go test -v'
      }
    ],
    resources: [
      {
        title: 'A Tour of Go',
        url: 'https://go.dev/tour/',
        type: 'Lab',
        isFree: true,
        notes: 'Interactive, browser-based official introduction to the Go programming language.'
      },
      {
        title: 'Go by Example',
        url: 'https://gobyexample.com',
        type: 'Docs',
        isFree: true,
        notes: 'Annotated examples covering every core Go feature from hello-world to HTTP servers.'
      }
    ],
    practiceTask: {
      title: 'Local JSON Event API in Go',
      description: 'Build a lightweight Go service that parses synthetic security events, validates request payloads, applies timeouts, and serves JSON counts on 127.0.0.1.',
      deliverable: 'A tested Go module with unit tests and clear API documentation.'
    },
    exitChecklist: [
      'I can build a self-contained binary using go build.',
      'I understand Go’s explicit error handling pattern (if err != nil).',
      'I can marshal and unmarshal JSON using Go structs.',
      'I built and tested a local HTTP server with request size limits and timeouts.'
    ],
    safetyWarning: 'Always bind beginner web servers to 127.0.0.1 (localhost) rather than 0.0.0.0 to prevent unintended exposure to the local network.'
  },
  {
    id: 'stage-9',
    number: 9,
    title: 'x86-64 Assembly & Reverse Engineering',
    subtitle: 'Peering into compiled machine instructions with Ghidra & GDB',
    timeEstimate: '8-12 weeks',
    sprintMonth: 'Month 6 & Beyond',
    goal: 'Understand x86-64 registers, stack frames, calling conventions, inspect binaries with GDB and objdump, and analyze self-compiled code in Ghidra.',
    eli9Metaphor: 'Assembly is the exact native language spoken by the silicon chip inside your computer. Reverse engineering is like being a forensic detective who reconstructs a car’s blueprint just by examining the finished engine.',
    topics: [
      {
        id: 's9-t1',
        title: 'x86-64 Architecture: Registers & Flags',
        description: 'General purpose registers (RAX, RBX, RCX, RDX, RSI, RDI, RSP, RBP, R8-R15), RIP (instruction pointer), and RFLAGS (ZF, CF, SF).',
        eli9: 'Registers are tiny, ultra-fast scratchpads right on the CPU chip where calculations happen.'
      },
      {
        id: 's9-t2',
        title: 'Common Instructions & Stack Frames',
        description: 'mov, add, sub, cmp, jmp, jne, je, push, pop, call, ret. System V calling conventions (RDI, RSI, RDX, RCX, R8, R9).',
        eli9: 'cmp checks if two numbers are equal; jne jumps to a different instruction if they are not.'
      },
      {
        id: 's9-t3',
        title: 'Binary Formats & Tools: ELF, strings, readelf',
        description: 'ELF sections (.text for code, .data/.rodata for variables), symbol tables, headers, and strings extraction.',
        eli9: 'An ELF file is like an organized book with a table of contents showing where instructions and words live.'
      },
      {
        id: 's9-t4',
        title: 'Dynamic Debugging with GDB',
        description: 'Setting breakpoints (b main), stepping through instructions (stepi, nexti), inspecting registers (info registers), and examining memory (x/10x $rsp).',
        eli9: 'GDB lets you pause a running program between every single CPU clock tick and inspect its thoughts.'
      },
      {
        id: 's9-t5',
        title: 'Static Analysis & Decompilation in Ghidra',
        description: 'Importing binaries, locating entry points, cross-references, analyzing control-flow graphs, and understanding decompiler limits.',
        eli9: 'Ghidra translates complicated machine code back into readable C-like pseudo-code for analysis.'
      }
    ],
    commands: [
      {
        name: 'gdb',
        syntax: 'gdb -q ./my_binary',
        category: 'Security',
        explanation: 'Launches the GNU Debugger to inspect registers, stack, and execution flow.',
        example: 'gdb -q ./program'
      },
      {
        name: 'objdump',
        syntax: 'objdump -d -M intel ./program',
        category: 'Security',
        explanation: 'Disassembles executable binary files into Intel syntax assembly instructions.',
        example: 'objdump -d -M intel ./program | grep -A 20 "<main>:"'
      },
      {
        name: 'readelf / strings',
        syntax: 'readelf -h ./program && strings ./program',
        category: 'Security',
        explanation: 'Displays ELF file header information and extracts readable ASCII strings.',
        example: 'strings -n 8 ./program'
      }
    ],
    resources: [
      {
        title: 'OpenSecurityTraining2: Architecture 1001 (x86-64 Assembly)',
        url: 'https://ost2.fyi',
        type: 'Course',
        isFree: true,
        notes: 'Exceptional, free self-paced low-level training course on modern x86-64 assembly language.'
      },
      {
        title: 'NSA Ghidra Beginner Student Guide & Documentation',
        url: 'https://ghidra-sre.org',
        type: 'Tool',
        isFree: true,
        notes: 'The NSA’s open-source software reverse-engineering suite with decompiler and graph analysis.'
      },
      {
        title: 'Compiler Explorer (Godbolt)',
        url: 'https://godbolt.org',
        type: 'Tool',
        isFree: true,
        notes: 'Live interactive tool showing C/C++ source code mapped line-by-line to generated assembly instructions.'
      }
    ],
    practiceTask: {
      title: 'Self-Compiled Binary Ghidra Report',
      description: 'Write a small C program with an if-statement and string. Compile it, examine it with GDB and strings, import it into Ghidra, and document the control flow.',
      deliverable: 'A written reverse-engineering report comparing your original source code with Ghidra decompiler output.'
    },
    exitChecklist: [
      'I can distinguish between assembly language, machine code, and decompiled pseudo-code.',
      'I can set breakpoints and inspect registers in GDB.',
      'I can identify mov, add, cmp, and conditional jump instructions.',
      'I imported a binary into Ghidra, located main, and mapped out its control flow graph.'
    ],
    safetyWarning: 'Never analyze unknown untrusted executables on your main computer. Always practice on self-compiled code, course files, or disposable isolated VMs.'
  },
  {
    id: 'stage-10',
    number: 10,
    title: 'Cybersecurity Fundamentals & Legal Labs',
    subtitle: 'Connecting foundations to real defensive and offensive concepts',
    timeEstimate: '6-8 weeks, ongoing',
    sprintMonth: 'Month 6 & Beyond',
    goal: 'Understand the CIA triad, threat modeling, hashing vs encryption, OWASP Top 10 (2025), solve beginner CTF challenges, and master lab write-ups.',
    eli9Metaphor: 'A cybersecurity engineer is a digital security guard and architect. You study how locks work, how thieves try to pick them, and how to build vaults so strong that nobody can break in.',
    topics: [
      {
        id: 's10-t1',
        title: 'The CIA Triad & Core Threat Modeling',
        description: 'Confidentiality, Integrity, Availability. Assets, threats, vulnerabilities, likelihood, impact, and mitigations.',
        eli9: 'Confidentiality = only the right people see it; Integrity = nobody altered it; Availability = it works when you need it.'
      },
      {
        id: 's10-t2',
        title: 'Cryptography: Hashing vs Encryption vs Encoding',
        description: 'Encoding (base64 representation) vs Hashing (one-way SHA-256 integrity digests) vs Encryption (reversible with secret key AES/RSA).',
        eli9: 'Encoding is translating to Spanish. Hashing is shredding paper into a unique dust fingerprint. Encryption is locking a box with a key.'
      },
      {
        id: 's10-t3',
        title: 'Web Application Security (OWASP Top 10: 2025)',
        description: 'Broken Access Control, Cryptographic Failures, Injection (SQLi, Command), Cross-Site Scripting (XSS), and Insecure Design.',
        eli9: 'OWASP Top 10 is the global leaderboard of the most common mistakes web developers make.'
      },
      {
        id: 's10-t4',
        title: 'Legal Labs & CTFs (TryHackMe & picoCTF)',
        description: 'Capture The Flag puzzles, guided browser labs, responsible evidence logging, and clear reporting.',
        eli9: 'CTF challenges give you legal puzzle rooms where solving problems teaches you defensive skills.'
      }
    ],
    commands: [
      {
        name: 'sha256sum',
        syntax: 'sha256sum file.iso',
        category: 'Security',
        explanation: 'Calculates the cryptographic SHA-256 hash digest to verify file integrity.',
        example: 'sha256sum ubuntu.iso'
      },
      {
        name: 'nmap (Authorized only)',
        syntax: 'nmap -sV -sC -p- 127.0.0.1',
        category: 'Security',
        explanation: 'Network scanner to discover open ports and service versions on authorized systems.',
        example: 'nmap 127.0.0.1',
        safeNote: 'Only scan 127.0.0.1 or authorized labs. Scanning public IP addresses without written permission is illegal.'
      }
    ],
    resources: [
      {
        title: 'TryHackMe: Pre Security Path',
        url: 'https://tryhackme.com/path/outline/pre-security',
        type: 'Lab',
        isFree: true,
        notes: 'Guided, beginner-friendly online labs covering computer, OS, networking, web, and security basics.'
      },
      {
        title: 'picoCTF (Carnegie Mellon University)',
        url: 'https://picoctf.org',
        type: 'Lab',
        isFree: true,
        notes: 'Free, world-class gamified security platform designed specifically for middle and high-school students.'
      },
      {
        title: 'PortSwigger Web Security Academy',
        url: 'https://portswigger.net/web-security',
        type: 'Lab',
        isFree: true,
        notes: '100% free, interactive labs teaching web application security directly from the creators of Burp Suite.'
      },
      {
        title: 'OWASP Top 10 (2025 Edition)',
        url: 'https://owasp.org/Top10',
        type: 'Docs',
        isFree: true,
        notes: 'The industry-standard reference for the top 10 most critical web application security risks.'
      }
    ],
    practiceTask: {
      title: '10 picoCTF / TryHackMe Solves & Lab Write-Up',
      description: 'Solve 10 beginner challenges across cryptography, web, and general skills. Write clear, redacted lab reports explaining what happened and how to defend.',
      deliverable: '10 documented lab reports following the 10-step template without exposing real secrets.'
    },
    exitChecklist: [
      'I can explain the difference between hashing, encryption, and encoding in simple words.',
      'I can describe how SQL injection and XSS happen and how to prevent them.',
      'I solved at least 10 beginner CTF or lab challenges and wrote reports.',
      'I know the non-negotiable legal rules and only practice on authorized platforms.'
    ],
    safetyWarning: 'Golden Ethical Rule: Attacking any system without explicit written permission is a serious crime that will destroy your career. Practice only on designated platforms.'
  },
  {
    id: 'stage-11',
    number: 11,
    title: 'Portfolio, Specialization & College Prep',
    subtitle: 'Building proof, choosing your direction, and standing out',
    timeEstimate: '4-6 weeks, ongoing',
    sprintMonth: 'Month 6 & Beyond',
    goal: 'Publish 3 to 5 polished GitHub projects with professional READMEs, select a specialization track, and prepare for computer science collegiate success.',
    eli9Metaphor: 'A portfolio is your trophy case and proof of skill. Instead of just saying "I am good at computers", you hand professors and employers working code, diagrams, and reports that prove your mastery.',
    topics: [
      {
        id: 's11-t1',
        title: 'The 3-Project Minimum Portfolio',
        description: 'Publish: (1) A Python utility, (2) A networking/log analysis report, and (3) A systems project (C/C++/Go/SQL) with tests and clear README.',
        eli9: 'Three finished, clean projects beat 50 half-finished copied tutorials every single time.'
      },
      {
        id: 's11-t2',
        title: 'Professional README Architecture',
        description: 'Purpose, problem statement, scope, installation, how to run, sample output, test cases, threats considered, and limitations.',
        eli9: 'A great README lets any stranger run and understand your project in under 2 minutes.'
      },
      {
        id: 's11-t3',
        title: 'Choosing a Specialization Track',
        description: 'Explore Blue Team/SOC, Forensics, AppSec, Cloud, DevSecOps, Reverse Engineering, Cryptography, or GRC based on your curiosity.',
        eli9: 'You do not have to choose your forever job today, but picking one path to explore deeply makes you stand out.'
      },
      {
        id: 's11-t4',
        title: 'College Readiness & 3-Minute Presentation Habit',
        description: 'Practice explaining complex technical concepts (e.g. how HTTPS works) to non-engineers in 3 minutes without stuttering.',
        eli9: 'If you can explain how a complex computer system works in simple words, you will excel in college interviews.'
      }
    ],
    commands: [
      {
        name: 'git tag',
        syntax: 'git tag -a v1.0.0 -m "Initial portfolio release"',
        category: 'Git',
        explanation: 'Tags a release version milestone in your Git project history.',
        example: 'git tag -a v1.0.0 -m "Release v1.0.0"'
      }
    ],
    resources: [
      {
        title: 'NIST NICE Cybersecurity Workforce Framework',
        url: 'https://www.nist.gov/itl/applied-cybersecurity/nice',
        type: 'Docs',
        isFree: true,
        notes: 'Detailed breakdown of professional cybersecurity career pathways, tasks, and required knowledge.'
      },
      {
        title: 'GitHub Skills',
        url: 'https://skills.github.com',
        type: 'Course',
        isFree: true,
        notes: 'Interactive guided modules on repository management, branch workflows, and professional collaboration.'
      }
    ],
    practiceTask: {
      title: 'Polished 3-Project GitHub Showcase',
      description: 'Polish 3 repositories: clean up code, remove temporary files, add comprehensive READMEs, test edge cases, and write a 1-page student learning summary.',
      deliverable: 'A clean, public GitHub profile pinned with 3 documented projects.'
    },
    exitChecklist: [
      'I have 3 or more published repositories with clear READMEs, tests, and screenshots.',
      'A stranger can clone my project, run it, and understand what it does without getting errors.',
      'I can present one technical project in 3 minutes explaining design choices and limitations.',
      'I have a clear study plan for the next semester balancing high-school academics, health, and CS growth.'
    ],
    safetyWarning: 'Never claim titles like "Expert Ethical Hacker" without proof. Let your reproducible code, write-ups, and humility speak for you.'
  }
];

export const BANDIT_LEVELS: BanditLevel[] = [
  {
    level: 0,
    title: 'Bandit Level 0 -> Level 1',
    goal: 'Log into the game via SSH on port 2220. The password for bandit0 is "bandit0". Find the password for the next level stored in a file called readme in the home directory.',
    sshCommand: 'ssh bandit0@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['ls', 'cat', 'cd', 'pwd'],
    hint: 'Use the `cat` command to read the contents of the `readme` file.',
    solutionConcept: 'Run `cat readme` to print the password to the terminal screen.',
    sampleFlagFormat: 'ZjLjK2...'
  },
  {
    level: 1,
    title: 'Bandit Level 1 -> Level 2',
    goal: 'The password for the next level is stored in a file called "-" located in the home directory.',
    sshCommand: 'ssh bandit1@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['cat', 'ls'],
    hint: 'In Linux, "-" usually means standard input. To force cat to treat it as a file, specify its relative path like `./-`.',
    solutionConcept: 'Run `cat ./-` to read the dash file.',
    sampleFlagFormat: '263QgS...'
  },
  {
    level: 2,
    title: 'Bandit Level 2 -> Level 3',
    goal: 'The password for the next level is stored in a file called "spaces in this filename" located in the home directory.',
    sshCommand: 'ssh bandit2@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['cat', 'ls'],
    hint: 'When file names contain spaces, wrap the filename in quotation marks or use backslashes to escape spaces, or use the Tab key for autocomplete.',
    solutionConcept: 'Run `cat "spaces in this filename"` or `cat spaces\\ in\\ this\\ filename`.',
    sampleFlagFormat: 'MNk8K1...'
  },
  {
    level: 3,
    title: 'Bandit Level 3 -> Level 4',
    goal: 'The password for the next level is stored in a hidden file in the inhere directory.',
    sshCommand: 'ssh bandit3@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['ls', 'cd', 'cat'],
    hint: 'Hidden files in Linux begin with a dot (.). Regular `ls` hides them. Check the manual page for `ls` to find the flag that shows all files.',
    solutionConcept: 'Run `cd inhere` and then `ls -la` to see the hidden `.hidden` file, then `cat .hidden`.',
    sampleFlagFormat: '2WJNVN...'
  },
  {
    level: 4,
    title: 'Bandit Level 4 -> Level 5',
    goal: 'The password for the next level is stored in the only human-readable file in the inhere directory.',
    sshCommand: 'ssh bandit4@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['file', 'ls', 'cat'],
    hint: 'The `file` command inspects the type of data inside a file (ASCII text, binary data, etc.).',
    solutionConcept: 'Run `cd inhere` and then `file ./*` to locate the ASCII text file, then read it with `cat`.',
    sampleFlagFormat: 'lrIWWI...'
  },
  {
    level: 5,
    title: 'Bandit Level 5 -> Level 6',
    goal: 'The password is in a file under inhere that is: human-readable, 1033 bytes in size, and not executable.',
    sshCommand: 'ssh bandit5@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['find', 'ls', 'cat'],
    hint: 'The `find` command can search by size and attributes: `find . -size 1033c ! -executable`.',
    solutionConcept: 'Run `find . -type f -size 1033c ! -executable -exec cat {} +` to retrieve the password instantly.',
    sampleFlagFormat: 'P4L4vB...'
  },
  {
    level: 6,
    title: 'Bandit Level 6 -> Level 7',
    goal: 'The password is stored somewhere on the server and is owned by user bandit7, owned by group bandit6, and 33 bytes in size.',
    sshCommand: 'ssh bandit6@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['find', 'grep'],
    hint: 'Search from root: `find / -user bandit7 -group bandit6 -size 33c 2>/dev/null`. Redirecting 2>/dev/null hides permission denied errors.',
    solutionConcept: 'Filtering out permission denied messages with `2>/dev/null` keeps your terminal clean.',
    sampleFlagFormat: 'z7WtoS...'
  },
  {
    level: 7,
    title: 'Bandit Level 7 -> Level 8',
    goal: 'The password is stored in the file data.txt next to the word "millionth".',
    sshCommand: 'ssh bandit7@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['grep', 'cat'],
    hint: 'Use `grep` to search for the specific word inside `data.txt`.',
    solutionConcept: 'Run `grep "millionth" data.txt` to see the password.',
    sampleFlagFormat: 'TESKNo...'
  },
  {
    level: 8,
    title: 'Bandit Level 8 -> Level 9',
    goal: 'The password is stored in data.txt and is the only line of text that occurs only once.',
    sshCommand: 'ssh bandit8@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['sort', 'uniq', 'cat'],
    hint: 'The `uniq` command only detects duplicate lines if they are adjacent. You must pipe into `sort` first!',
    solutionConcept: 'Run `sort data.txt | uniq -u` to find the uniquely occurring line.',
    sampleFlagFormat: 'EN632x...'
  },
  {
    level: 9,
    title: 'Bandit Level 9 -> Level 10',
    goal: 'The password is in data.txt in one of the few human-readable strings, preceded by several "=" characters.',
    sshCommand: 'ssh bandit9@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['strings', 'grep'],
    hint: 'The file is mostly binary. Use `strings data.txt` to filter out binary junk and pipe into `grep "=="`.',
    solutionConcept: 'Run `strings data.txt | grep "==="` to locate the password string.',
    sampleFlagFormat: 'G7w8LI...'
  },
  {
    level: 10,
    title: 'Bandit Level 10 -> Level 11',
    goal: 'The password for the next level is stored in data.txt, which contains base64 encoded data.',
    sshCommand: 'ssh bandit10@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['base64'],
    hint: 'Use `base64 -d` to decode the text string.',
    solutionConcept: 'Run `base64 -d data.txt` to print the plaintext password.',
    sampleFlagFormat: '6zPezi...'
  },
  {
    level: 11,
    title: 'Bandit Level 11 -> Level 12',
    goal: 'The password is stored in data.txt, where all lowercase and uppercase letters have been rotated by 13 positions (ROT13).',
    sshCommand: 'ssh bandit11@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['tr'],
    hint: 'The `tr` command translates characters: `tr "A-Za-z" "N-ZA-Mn-za-m"`.',
    solutionConcept: 'Run `cat data.txt | tr "A-Za-z" "N-ZA-Mn-za-m"` to un-rotate the letters.',
    sampleFlagFormat: 'JVNBBF...'
  },
  {
    level: 12,
    title: 'Bandit Level 12 -> Level 13',
    goal: 'The password is in data.txt, which is a hexdump of a file that has been repeatedly compressed with gzip, bzip2, and tar.',
    sshCommand: 'ssh bandit12@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['xxd', 'file', 'tar', 'gzip', 'bzip2', 'mkdir', 'cp'],
    hint: 'Make a temp folder in /tmp. Convert the hexdump back to binary with `xxd -r data.txt > file`. Use `file` to inspect compression type, rename, and decompress iteratively.',
    solutionConcept: 'Repeatedly inspect file types with `file` and decompress step by step.',
    sampleFlagFormat: 'wb3TaE...'
  },
  {
    level: 13,
    title: 'Bandit Level 13 -> Level 14',
    goal: 'The password for the next level can be retrieved by logging in to localhost on port 2220 using the private SSH key stored in sshkey.private.',
    sshCommand: 'ssh bandit13@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['ssh'],
    hint: 'Use the `-i` flag with SSH: `ssh -i sshkey.private -p 2220 bandit14@localhost`.',
    solutionConcept: 'SSH with private key authentication without a password prompt.',
    sampleFlagFormat: 'fGrHPx...'
  },
  {
    level: 14,
    title: 'Bandit Level 14 -> Level 15',
    goal: 'The password for the next level can be retrieved by submitting the password of the current level to port 30000 on localhost.',
    sshCommand: 'ssh bandit14@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['nc', 'telnet'],
    hint: 'Use `nc localhost 30000` (netcat) and paste your current bandit14 password into the socket.',
    solutionConcept: 'Netcat transmits raw text across an open TCP socket connection.',
    sampleFlagFormat: 'jN2kgS...'
  },
  {
    level: 15,
    title: 'Bandit Level 15 -> Level 16',
    goal: 'The password for the next level can be retrieved by submitting the password of the current level to port 30001 on localhost using SSL/TLS encryption.',
    sshCommand: 'ssh bandit15@bandit.labs.overthewire.org -p 2220',
    usefulCommands: ['openssl s_client'],
    hint: 'Plain netcat does not speak TLS. Use `openssl s_client -connect localhost:30001` and submit your password once connected.',
    solutionConcept: 'OpenSSL s_client wraps raw socket communication inside an encrypted TLS tunnel.',
    sampleFlagFormat: 'MQ7TaZ...'
  }
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    number: 1,
    title: 'Password Policy & Strength Evaluator',
    tools: ['Python'],
    difficulty: 'Easy',
    brief: 'Accepts a password string in memory only; evaluates length, character diversity, and simple policy checks. Does not send passwords over networks or write them to disk.',
    acceptanceCriteria: [
      'Unit tests for various lengths and character mixes',
      'No disk storage or external network calls',
      'Clear documentation explaining that strength algorithms provide estimates, not guarantees',
      'Handles empty and whitespace inputs gracefully'
    ],
    learningOutcome: 'String processing, test automation, and defensive data privacy.'
  },
  {
    id: 'proj-2',
    number: 2,
    title: 'File Integrity Checker (SHA-256 Manifest)',
    tools: ['Python', 'hashlib'],
    difficulty: 'Easy',
    brief: 'Generates a manifest of SHA-256 cryptographic hashes for files in a designated test directory, and detects modified or corrupted files upon re-verification.',
    acceptanceCriteria: [
      'Generates repeatable hash manifests for known files',
      'Detects single-byte modifications accurately',
      'Handles non-existent files and path traversal attempts safely',
      'Explains in documentation that hashing verifies integrity, not safety from malware'
    ],
    learningOutcome: 'Cryptographic hashing, file I/O, and integrity verification.'
  },
  {
    id: 'proj-3',
    number: 3,
    title: 'Local Port Scanner for Practice Labs',
    tools: ['Python', 'socket'],
    difficulty: 'Medium',
    brief: 'Scans designated TCP port ranges on localhost or an isolated lab virtual machine. Defaults strictly to 127.0.0.1 and displays banner information if available.',
    acceptanceCriteria: [
      'Strictly defaults to loopback (127.0.0.1)',
      'Requires explicit command-line confirmation before scanning',
      'Handles timeouts, connection refused, and unreachable hosts',
      'Prominent disclaimer explaining authorization and ethics'
    ],
    learningOutcome: 'TCP networking, socket programming, timeouts, and scanner ethics.'
  },
  {
    id: 'proj-4',
    number: 4,
    title: 'Synthetic Log Analyzer & Alert Detector',
    tools: ['Python', 'regex', 'csv'],
    difficulty: 'Medium',
    brief: 'Parses a synthetic web server or authentication log, flags repeated failed login attempts from individual IP addresses, and produces a summary report.',
    acceptanceCriteria: [
      'Uses synthetic or lab data exclusively (no real user information)',
      'Parses malformed lines without crashing',
      'Calculates frequency counts and threshold alerts',
      'Explains potential false positives in the README'
    ],
    learningOutcome: 'Regular expressions, data parsing, detection logic, and error resilience.'
  },
  {
    id: 'proj-5',
    number: 5,
    title: 'Caesar & XOR Cipher Teaching Tool',
    tools: ['Python'],
    difficulty: 'Easy',
    brief: 'Interactive command-line tool demonstrating classic historical Caesar rotation and bitwise XOR transformations for educational understanding.',
    acceptanceCriteria: [
      'Demonstrates encryption and decryption steps clearly',
      'Prominently labeled as an educational toy, not secure modern encryption',
      'Unit tests verifying round-trip reversibility',
      'Explains frequency analysis weaknesses in the documentation'
    ],
    learningOutcome: 'Bitwise operations, historical cryptography, and modern security distinctions.'
  },
  {
    id: 'proj-6',
    number: 6,
    title: 'Secure Local Login Demonstration App',
    tools: ['Python', 'Flask', 'SQLite'],
    difficulty: 'Medium',
    brief: 'A minimal local-only web application demonstrating password hashing with a vetted library (bcrypt/argon2), secure session management, and parameterized SQL queries.',
    acceptanceCriteria: [
      'Passwords hashed with salt using a standard vetted library',
      'All database queries use parameterized placeholders',
      'Strictly binds to 127.0.0.1 for local study only',
      'Tests for authorization boundaries (logged out vs logged in)'
    ],
    learningOutcome: 'Web authentication, password hashing, parameterized SQL, and session cookies.'
  },
  {
    id: 'proj-7',
    number: 7,
    title: 'Threat Model & Security Assessment Report',
    tools: ['Markdown', 'Diagrams'],
    difficulty: 'Medium',
    brief: 'A structured, professional threat model evaluating a hypothetical student portal or toy web application across assets, boundaries, threats, and mitigations.',
    acceptanceCriteria: [
      'Clear definition of system scope and out-of-scope boundaries',
      'Asset inventory and trust boundary diagrams',
      'Prioritized mitigations with trade-off analysis',
      'Clear explanation of residual risks'
    ],
    learningOutcome: 'Systems thinking, architectural risk assessment, and technical documentation.'
  },
  {
    id: 'proj-8',
    number: 8,
    title: 'Incident Response Tabletop Simulation',
    tools: ['Markdown', 'Slides'],
    difficulty: 'Medium',
    brief: 'Walks through a fictional incident scenario (e.g. exposed API key or credential stuffing) and establishes a timeline, containment plan, and lessons learned.',
    acceptanceCriteria: [
      'Structured timeline distinguishing confirmed facts from hypotheses',
      'Step-by-step containment, eradication, and recovery plan',
      'Evidence preservation log with timestamps',
      'Post-incident improvement recommendations'
    ],
    learningOutcome: 'Incident response lifecycles, digital evidence hygiene, and crisis communication.'
  },
  {
    id: 'proj-9',
    number: 9,
    title: 'Virtual Network Topology Design Lab',
    tools: ['Cisco Packet Tracer'],
    difficulty: 'Medium',
    brief: 'Designs a multi-subnet network containing an internal LAN, a server subnet, a guest Wi-Fi network, and firewall rules in Cisco Packet Tracer.',
    acceptanceCriteria: [
      'Complete IP addressing table with CIDR prefixes',
      'Demonstrated routing between subnets with access-list boundaries',
      'DNS and DHCP server configurations verified',
      'Comprehensive topology diagram and documentation'
    ],
    learningOutcome: 'Network segmentation, routing, firewall rules, and visual architecture.'
  },
  {
    id: 'proj-10',
    number: 10,
    title: 'Software Dependency Inventory & Audit Tool',
    tools: ['Python', 'pip'],
    difficulty: 'Easy',
    brief: 'Inspects a project’s requirements.txt, produces a structured bill of materials, and checks packages against known vulnerability databases.',
    acceptanceCriteria: [
      'Reproducible output in JSON and text format',
      'Distinguishes direct vs transitive dependencies',
      'Includes license and maintenance metadata notes',
      'Documents update and patching strategy in the README'
    ],
    learningOutcome: 'Software supply chain security, bill of materials, and dependency management.'
  },
  {
    id: 'proj-11',
    number: 11,
    title: 'Security Checklist Generator Web Tool',
    tools: ['Python' , 'HTML/JS'],
    difficulty: 'Easy',
    brief: 'A lightweight interactive tool that asks students questions about their projects and outputs a customized security and privacy checklist.',
    acceptanceCriteria: [
      'Validates all form inputs',
      'Does not store or transmit private user information',
      'Outputs actionable, plain-language checklist steps',
      'Unit tests for recommendation rules'
    ],
    learningOutcome: 'User input validation, security controls mapping, and accessible UI.'
  },
  {
    id: 'proj-12',
    number: 12,
    title: 'Relational Security Event SQL Database',
    tools: ['SQL', 'SQLite'],
    difficulty: 'Medium',
    brief: 'Designs a normalized relational database schema with tables for hosts, users, and audit events, featuring parameterized filtering queries and joins.',
    acceptanceCriteria: [
      'Normalized schema with primary and foreign key constraints',
      'Queries using INNER JOIN, GROUP BY, and aggregate counts',
      'Demonstrates parameterized queries preventing injection',
      'Synthetic sample data only with schema documentation'
    ],
    learningOutcome: 'Relational schema design, database normalization, and SQL query efficiency.'
  },
  {
    id: 'proj-13',
    number: 13,
    title: 'C Memory-Safe Log Parser',
    tools: ['C', 'GCC', 'GDB'],
    difficulty: 'Medium',
    brief: 'A fast, compiled C command-line program that reads a structured synthetic log file with bounded buffers, robust error handling, and zero memory leaks.',
    acceptanceCriteria: [
      'Compiles with -Wall -Wextra -Werror with zero warnings',
      'Handles malformed rows and buffer length boundaries safely',
      'Releases all allocated memory correctly',
      'Verified with Valgrind / AddressSanitizer with zero leaks'
    ],
    learningOutcome: 'Native compiled C, memory bounds checking, pointers, and memory sanitizers.'
  },
  {
    id: 'proj-14',
    number: 14,
    title: 'Modern C++ Typed Event Summarizer',
    tools: ['C++', 'Standard Library'],
    difficulty: 'Medium',
    brief: 'A clean command-line utility built with modern C++ standard containers (std::vector, std::map) and RAII to aggregate and report security metrics.',
    acceptanceCriteria: [
      'Uses RAII and standard containers exclusively (no owning raw pointers)',
      'Handles invalid file inputs and exceptions cleanly',
      'Multi-file compilation with header separation',
      'Unit tests verifying aggregation logic'
    ],
    learningOutcome: 'Modern C++, standard template library, RAII object lifetime, and type safety.'
  }
];

export const SPECIALIZATION_TRACKS: SpecializationTrack[] = [
  {
    id: 'spec-blue',
    name: 'Blue Team / SOC Analyst',
    role: 'Defensive Monitoring & Response',
    whatItDoes: 'Monitors telemetry, analyzes alerts, enriches evidence, investigates suspicious activity, and improves defensive firewalls and detection rules.',
    foundations: 'System logs (Linux/Windows), TCP/IP networking, SIEM concepts, triage timelines, and detection logic.',
    beginnerProof: 'Synthetic log analyzer, Wireshark packet capture write-up, and a documented mock incident report.'
  },
  {
    id: 'spec-forensics',
    name: 'Digital Forensics & Incident Response (DFIR)',
    role: 'Evidence Preservation & Investigation',
    whatItDoes: 'Preserves and analyzes digital evidence, reconstructs forensic timelines, assesses incident scope, and supports system recovery.',
    foundations: 'Filesystem structures, OS internals, evidence integrity (hashes), chain-of-custody protocols.',
    beginnerProof: 'A fictional incident timeline with SHA-256 evidence hashes and chain-of-custody documentation.'
  },
  {
    id: 'spec-appsec',
    name: 'Application Security / Ethical Pentesting',
    role: 'Web & Software Security Assessment',
    whatItDoes: 'Assists developers in identifying and fixing vulnerabilities in authorized applications and APIs before attackers can exploit them.',
    foundations: 'HTTP/HTTPS, JavaScript, SQL, sessions, access control, OWASP Top 10, threat modeling, and secure coding.',
    beginnerProof: 'PortSwigger Web Security Academy lab write-ups and a secure-by-design toy login application.'
  },
  {
    id: 'spec-cloud',
    name: 'Cloud Security',
    role: 'Infrastructure & Workload Protection',
    whatItDoes: 'Secures identities, storage buckets, virtual networks, containers, and serverless workloads in AWS and Azure environments.',
    foundations: 'Identity & Access Management (IAM), network boundaries, encryption in transit/rest, shared responsibility model.',
    beginnerProof: 'An architecture diagram and security checklist for a fictional multi-tier cloud application.'
  },
  {
    id: 'spec-devsecops',
    name: 'Security Engineering / DevSecOps',
    role: 'Automated Controls & Pipeline Security',
    whatItDoes: 'Builds automated security checks, code scanning, dependency auditing, and secrets detection directly into software delivery pipelines.',
    foundations: 'Git workflows, testing, dependency management, CI/CD basics, container security, and system hardening.',
    beginnerProof: 'A automated GitHub Actions pipeline running unit tests, linting, and dependency security audits.'
  },
  {
    id: 'spec-re',
    name: 'Reverse Engineering Research',
    role: 'Binary Analysis & Low-Level Systems',
    whatItDoes: 'Analyzes compiled binary software to understand its behavior, reverse-engineers protocols, and identifies low-level software vulnerabilities.',
    foundations: 'C/C++ basics, x86-64 assembly language, OS memory architecture, GDB debugging, and Ghidra.',
    beginnerProof: 'A static analysis report on a benign self-compiled binary explaining functions and control flow in Ghidra.'
  },
  {
    id: 'spec-crypto',
    name: 'Cryptography & Protocol Security',
    role: 'Mathematical Security Foundations',
    whatItDoes: 'Understands cryptographic primitives, secure key exchanges, digital signatures, and mathematical foundations of confidentiality.',
    foundations: 'Modular arithmetic, probability, discrete math, hash algorithms, public-key infrastructure (PKI).',
    beginnerProof: 'CryptoHack challenge notes and a technical report comparing symmetric vs asymmetric encryption primitives.'
  },
  {
    id: 'spec-grc',
    name: 'Governance, Risk, Compliance & Privacy (GRC)',
    role: 'Security Policies & Risk Management',
    whatItDoes: 'Translates technical risks into organizational policies, compliance audits (ISO 27001, NIST CSF), and privacy protections.',
    foundations: 'Risk assessment methodologies, data classification, privacy principles (GDPR), audit evidence collection.',
    beginnerProof: 'A lightweight risk register and privacy policy drafted for a fictional student mobile app.'
  }
];

export const ESSENTIAL_BOOKS = [
  {
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James Kurose & Keith Ross',
    why: 'The standard university networking textbook. Teaches application layer first (DNS, HTTP) before descending to routing and transport.',
    level: 'Beginner to Intermediate'
  },
  {
    title: 'Code: The Hidden Language of Computer Hardware and Software',
    author: 'Charles Petzold',
    why: 'Explains computers from the ground up starting with flashlights, switches, relays, logic gates, and building up to modern CPUs.',
    level: 'Absolute Beginner'
  },
  {
    title: 'Automate the Boring Stuff with Python',
    author: 'Al Sweigart',
    why: 'Practical, project-oriented beginner guide to automating everyday tasks with Python. Available completely free online.',
    level: 'Beginner'
  },
  {
    title: 'The Linux Command Line',
    author: 'William Shotts',
    why: 'A comprehensive, structured guide to mastering the shell, files, permissions, and bash scripting. Available free online.',
    level: 'Beginner'
  },
  {
    title: 'Security Engineering',
    author: 'Ross Anderson',
    why: 'A masterwork on security systems design, human factors, economics, and access control. Free online from author’s website.',
    level: 'Intermediate'
  },
  {
    title: 'Serious Cryptography',
    author: 'Jean-Philippe Aumasson',
    why: 'A clear, modern guide to practical cryptography: hashing, ciphers, public-key crypto, and implementation pitfalls.',
    level: 'Intermediate'
  },
  {
    title: 'Hacking: The Art of Exploitation',
    author: 'Jon Erickson',
    why: 'Teaches C programming, memory layout, machine architecture, and exploitation concepts from a technical perspective.',
    level: 'Intermediate'
  },
  {
    title: 'The Web Application Hacker’s Handbook',
    author: 'Dafydd Stuttard & Marcus Pinto',
    why: 'The foundational classic reference on web security. Pair with the actively maintained PortSwigger Web Security Academy.',
    level: 'Intermediate'
  }
];

export const YOUTUBE_CHANNELS = [
  { name: 'Crash Course Computer Science', focus: 'How computers, chips, logic, and software work', level: 'Beginner' },
  { name: 'CS50 (Harvard)', focus: 'Best introductory programming and CS lectures in the world', level: 'Beginner' },
  { name: 'freeCodeCamp.org', focus: 'Full multi-hour video courses on Python, C++, Linux, and networking', level: 'Beginner' },
  { name: 'Neso Academy', focus: 'Digital logic, C programming, operating systems, and computer networks', level: 'Beginner' },
  { name: 'Professor Messer', focus: 'CompTIA Network+ and Security+ modular concept videos', level: 'Beginner to Intermediate' },
  { name: 'NetworkChuck', focus: 'Energetic, motivating introductions to Linux, coffee, and networking', level: 'Beginner' },
  { name: 'David Bombal', focus: 'Hands-on networking, Wireshark, Packet Tracer, and ethical hacking', level: 'Beginner to Intermediate' },
  { name: '3Blue1Brown', focus: 'Unmatched visual mathematical foundations, linear algebra, and logic', level: 'All Levels' },
  { name: 'Computerphile', focus: 'Clear conceptual explanations from computer science professors', level: 'All Levels' },
  { name: 'John Hammond', focus: 'Malware analysis, CTF puzzle walkthroughs, and security education', level: 'Intermediate' },
  { name: 'The Cyber Mentor (TCM Security)', focus: 'Practical ethical hacking and cybersecurity career advice', level: 'Beginner to Intermediate' },
  { name: 'LiveOverflow', focus: 'Deep technical binary exploitation, reverse engineering, and web security', level: 'Advanced' },
  { name: 'IppSec', focus: 'Detailed, systematic Hack The Box machine walkthroughs', level: 'Advanced' },
  { name: 'PwnFunction', focus: 'Animated visual breakdowns of web security vulnerabilities (XSS, CSRF)', level: 'Beginner' },
  { name: 'Low Level Learning', focus: 'C programming, x86-64 assembly, and hardware reverse engineering', level: 'Intermediate' }
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Network & Protocols
  { term: 'Packet', simpleEnglish: 'A small formatted unit of data traveling across a network containing headers and payload.', category: 'Network' },
  { term: 'Protocol', simpleEnglish: 'An agreed set of rules and formats for computer communication (e.g. HTTP, TCP, UDP).', category: 'Network' },
  { term: 'IP Address', simpleEnglish: 'A unique logical numerical address assigned to every device on a TCP/IP network (IPv4 or IPv6).', category: 'Network' },
  { term: 'MAC Address', simpleEnglish: 'A physical, permanent hardware address burned into a network card (NIC) by the manufacturer.', category: 'Network' },
  { term: 'DNS (Domain Name System)', simpleEnglish: 'The internet telephone book that translates human-friendly domain names (e.g. google.com) into IP addresses.', category: 'Network' },
  { term: 'DHCP', simpleEnglish: 'A protocol that automatically assigns IP addresses, subnet masks, and default gateways to devices on a network.', category: 'Network' },
  { term: 'Subnet & CIDR', simpleEnglish: 'A logical division of an IP network using a prefix length (like /24) to segment hosts and manage broadcast domains.', category: 'Network' },
  { term: 'Port', simpleEnglish: 'A numbered software communication endpoint on an operating system for specific network services (e.g. 80, 443, 22).', category: 'Network' },
  { term: 'Socket', simpleEnglish: 'The combination of an IP address and a port number representing a live bidirectional network connection.', category: 'Network' },
  { term: 'TCP (Transmission Control Protocol)', simpleEnglish: 'A reliable, connection-oriented transport protocol using 3-way handshakes and packet acknowledgments.', category: 'Network' },
  { term: 'UDP (User Datagram Protocol)', simpleEnglish: 'A lightweight, connectionless transport protocol prioritizing speed over guaranteed packet delivery (used in gaming/video).', category: 'Network' },
  { term: 'ICMP', simpleEnglish: 'Internet Control Message Protocol used by network devices and ping for diagnostic and error reporting.', category: 'Network' },
  { term: 'ARP', simpleEnglish: 'Address Resolution Protocol mapping an IP address to a local physical MAC address on an Ethernet switch.', category: 'Network' },
  { term: 'Firewall', simpleEnglish: 'A security system or filter that monitors and inspects network packets, blocking unauthorized traffic.', category: 'Network' },
  { term: 'NAT (Network Address Translation)', simpleEnglish: 'A method remapping private local LAN IP addresses to a single public IP address at the router.', category: 'Network' },
  { term: 'VPN (Virtual Private Network)', simpleEnglish: 'An encrypted tunnel across the public internet connecting remote devices securely to a private network.', category: 'Network' },
  { term: 'Proxy & Reverse Proxy', simpleEnglish: 'An intermediary server forwarding client requests; a reverse proxy fronts servers for load balancing and security.', category: 'Network' },

  // System & OS Architecture
  { term: 'Kernel', simpleEnglish: 'The privileged core heart of an operating system managing hardware, CPU scheduling, and memory.', category: 'System' },
  { term: 'System Call (Syscall)', simpleEnglish: 'A programmatic request made by user software to the kernel requesting hardware, file I/O, or network sockets.', category: 'System' },
  { term: 'Process', simpleEnglish: 'An executing instance of a computer program with its own dedicated virtual memory address space.', category: 'System' },
  { term: 'Thread', simpleEnglish: 'The smallest unit of execution inside a process; threads in the same process share memory and heap space.', category: 'System' },
  { term: 'Context Switching', simpleEnglish: 'The CPU saving one running process state and loading another, creating the illusion of smooth multitasking.', category: 'System' },
  { term: 'Virtual Memory', simpleEnglish: 'An OS abstraction mapping program virtual addresses to physical RAM pages and disk swap space.', category: 'System' },
  { term: 'Paging & Page Fault', simpleEnglish: 'Dividing memory into fixed-size blocks (pages); a page fault occurs when a requested page must be loaded from disk.', category: 'System' },
  { term: 'Stack Memory', simpleEnglish: 'Fast, automated LIFO memory allocated for local function variables and call stack frames.', category: 'System' },
  { term: 'Heap Memory', simpleEnglish: 'Flexible dynamic memory allocated at runtime via malloc/new that must be explicitly freed.', category: 'System' },
  { term: 'Inode', simpleEnglish: 'A filesystem data structure storing file metadata (size, permissions, owner, timestamps, and disk block pointers).', category: 'System' },
  { term: 'File Descriptor', simpleEnglish: 'A non-negative integer handle used by Linux to identify open files, sockets, and pipes (0=stdin, 1=stdout, 2=stderr).', category: 'System' },
  { term: 'Pipe & Redirection', simpleEnglish: 'Directing the output stream of one program directly into the input stream of another (|), or to a file (>, >>).', category: 'System' },
  { term: 'Daemon', simpleEnglish: 'A background service process running without a controlling terminal, waiting for events or requests.', category: 'System' },
  { term: 'Cron Job', simpleEnglish: 'A scheduled background task in Linux that runs scripts or commands automatically at specified intervals.', category: 'System' },
  { term: 'ELF / PE', simpleEnglish: 'Standard executable binary file formats used by Linux (ELF - Executable and Linkable Format) and Windows (PE).', category: 'System' },
  { term: 'Deadlock', simpleEnglish: 'A permanent freeze state where two or more threads are each waiting for resources locked by the other.', category: 'System' },

  // Hardware & Fundamentals
  { term: 'Transistor', simpleEnglish: 'A microscopic semiconductor switch inside a microchip that turns electrical current on (1) or off (0).', category: 'Hardware' },
  { term: 'Bit & Byte', simpleEnglish: 'A bit is a single binary digit (0 or 1); a byte is a group of 8 bits capable of representing 256 unique values.', category: 'Hardware' },
  { term: 'CPU Clock Speed', simpleEnglish: 'The frequency (measured in gigahertz, GHz) at which a processor executes internal electrical cycles per second.', category: 'Hardware' },
  { term: 'Registers & ALU', simpleEnglish: 'Registers are tiny, ultra-fast memory slots inside the CPU; the ALU (Arithmetic Logic Unit) computes math and logic.', category: 'Hardware' },
  { term: 'CPU Cache (L1/L2/L3)', simpleEnglish: 'Small, high-speed on-chip SRAM memory that caches frequently accessed instructions and data close to the CPU cores.', category: 'Hardware' },
  { term: 'Endianness (Little vs Big)', simpleEnglish: 'The byte ordering in multi-byte data: Little-endian stores least significant byte first (x86); Big-endian stores most significant first.', category: 'Hardware' },

  // Security, Cryptography & Defense
  { term: 'CIA Triad', simpleEnglish: 'Confidentiality (privacy), Integrity (accuracy/no tampering), and Availability (uptime): the 3 pillars of security.', category: 'Security' },
  { term: 'Hash Function', simpleEnglish: 'A mathematical one-way function producing a fixed-size fingerprint from arbitrary data that cannot be decrypted.', category: 'Security' },
  { term: 'Salt (Hashing)', simpleEnglish: 'Random cryptographic data appended to a password before hashing to defeat precomputed rainbow tables.', category: 'Security' },
  { term: 'Symmetric Encryption', simpleEnglish: 'Using the exact same secret key to both encrypt and decrypt data (e.g. AES-256).', category: 'Security' },
  { term: 'Asymmetric Cryptography', simpleEnglish: 'Using a mathematically paired public key for encryption and private key for decryption (e.g. RSA, ECC).', category: 'Security' },
  { term: 'TLS / SSL', simpleEnglish: 'Transport Layer Security: cryptographic protocols securing network communications over the internet.', category: 'Security' },
  { term: 'Public Key Infrastructure (PKI)', simpleEnglish: 'A framework of Certificate Authorities (CAs) and digital certificates that bind public keys to identities.', category: 'Security' },
  { term: 'Zero-Knowledge Proof', simpleEnglish: 'A cryptographic method proving to a verifier that you possess a secret without revealing the secret itself.', category: 'Security' },
  { term: 'Rainbow Table', simpleEnglish: 'A precomputed lookup table of password plaintext hashes used for reverse password cracking.', category: 'Security' },
  { term: 'Least Privilege', simpleEnglish: 'Giving a user, service, or program only the exact bare minimum permissions needed to do its job.', category: 'Security' },
  { term: 'Defense in Depth', simpleEnglish: 'Layering multiple independent security controls (firewall + MFA + encryption + logging) so no single failure causes breach.', category: 'Security' },
  { term: 'Zero-day Vulnerability', simpleEnglish: 'A security vulnerability unknown to the software vendor, leaving zero days to fix before exploitation.', category: 'Security' },
  { term: 'Payload', simpleEnglish: 'The actual active execution code delivered by an exploit to achieve the attacker’s objective.', category: 'Security' },
  { term: 'Buffer Overflow', simpleEnglish: 'When data exceeds allocated memory bounds and corrupts adjacent stack or heap variables.', category: 'Security' },
  { term: 'SQL Injection', simpleEnglish: 'Smuggling malicious database queries through unvalidated user inputs to steal or modify data.', category: 'Security' },
  { term: 'Cross-Site Scripting (XSS)', simpleEnglish: 'Injecting malicious JavaScript into trusted web pages that executes within victim browsers.', category: 'Security' },
  { term: 'CSRF', simpleEnglish: 'Cross-Site Request Forgery: tricking an authenticated user into executing unwanted actions on a trusted site.', category: 'Security' },
  { term: 'SOC (Security Operations Center)', simpleEnglish: 'A 24/7 centralized team of analysts monitoring telemetry, analyzing alerts, and defending enterprise systems.', category: 'Security' },
  { term: 'SIEM', simpleEnglish: 'Security Information and Event Management: software that aggregates and correlates logs across all network hosts.', category: 'Security' },
  { term: 'MITRE ATT&CK', simpleEnglish: 'A globally accessible knowledge base of adversary tactics, techniques, and procedures based on real-world observations.', category: 'Security' },
  { term: 'Incident Response', simpleEnglish: 'The structured process of detecting, containing, eradicating, and recovering from an active security breach.', category: 'Security' },
  { term: 'Chain of Custody', simpleEnglish: 'Chronological documentation showing who collected, analyzed, and secured digital evidence for legal validity.', category: 'Security' },
  { term: 'Sandboxing', simpleEnglish: 'Isolating an application or untrusted script inside a restricted virtual jail so it cannot touch host files.', category: 'Security' },
  { term: 'Honeypot', simpleEnglish: 'A decoy system deliberately exposed to detect, deflect, or study attacker behaviors and techniques.', category: 'Security' },

  // Programming & Dev
  { term: 'Compiler', simpleEnglish: 'A software program that translates human-readable source code (C/C++) into executable machine code (ELF/PE).', category: 'Dev' },
  { term: 'Interpreter', simpleEnglish: 'A program that reads and executes code line-by-line directly at runtime (like Python) without a prior build step.', category: 'Dev' },
  { term: 'JIT (Just-In-Time) Compiler', simpleEnglish: 'A hybrid engine (used in V8/Java) compiling bytecode into native machine instructions at runtime for speed.', category: 'Dev' },
  { term: 'Pointer & Dereferencing', simpleEnglish: 'A pointer is a variable holding a memory address; dereferencing (*) reads or writes the value stored at that address.', category: 'Dev' },
  { term: 'Memory Leak', simpleEnglish: 'Failure to release allocated heap memory, causing the process to slowly consume all available RAM.', category: 'Dev' },
  { term: 'Recursion', simpleEnglish: 'A programming technique where a function calls itself until reaching a defined base termination condition.', category: 'Dev' },
  { term: 'Race Condition', simpleEnglish: 'A concurrency flaw where the output depends on the unpredictable execution order of simultaneous threads.', category: 'Dev' },
  { term: 'Mutex (Mutual Exclusion)', simpleEnglish: 'A locking mechanism ensuring that only one thread can access a shared memory resource at any instant.', category: 'Dev' },
  { term: 'CI/CD Pipeline', simpleEnglish: 'Continuous Integration & Continuous Delivery: automated pipelines running linting, tests, and builds on code commits.', category: 'Dev' },
  { term: 'Big-O Notation', simpleEnglish: 'A mathematical notation describing the limiting behavior of an algorithm’s runtime or memory as input size grows.', category: 'Theory' },
  { term: 'Binary Search', simpleEnglish: 'An efficient O(log N) algorithm finding an item in a sorted array by repeatedly dividing the search interval in half.', category: 'Theory' },
  { term: 'Hash Table', simpleEnglish: 'A data structure associating keys with values via a hash function, providing average O(1) constant-time lookups.', category: 'Theory' },

  // Web & Databases
  { term: 'HTTP / HTTPS', simpleEnglish: 'Hypertext Transfer Protocol for web communication; HTTPS adds TLS encryption for confidentiality and authentication.', category: 'Web' },
  { term: 'Cookie vs Session', simpleEnglish: 'Cookies are stored on client browsers; sessions maintain server-side user state mapped by a session ID cookie.', category: 'Web' },
  { term: 'JWT (JSON Web Token)', simpleEnglish: 'A compact, URL-safe means of representing digitally signed claims between two parties.', category: 'Web' },
  { term: 'REST API', simpleEnglish: 'Representational State Transfer: an architectural style using standard HTTP verbs (GET, POST, PUT, DELETE) on resource URLs.', category: 'Web' },
  { term: 'Relational Database (RDBMS)', simpleEnglish: 'A structured database organizing data into tables with rows and columns, linked via primary and foreign keys.', category: 'Database' },
  { term: 'SQL Prepared Statement', simpleEnglish: 'A precompiled query separating SQL syntax from untrusted parameters, completely eliminating SQL injection.', category: 'Database' },
  { term: 'ACID Properties', simpleEnglish: 'Atomicity, Consistency, Isolation, and Durability: guarantees ensuring reliable database transactions.', category: 'Database' }
];

export const ALL_GLOBAL_COMMANDS: CommandItem[] = [
  // Linux Filesystem Operations
  { name: 'ls', syntax: 'ls -la [dir]', category: 'Linux', explanation: 'Lists directory contents with details (permissions, size, owner) and hidden files.', example: 'ls -la /var/log' },
  { name: 'cd', syntax: 'cd <path>', category: 'Linux', explanation: 'Changes current working directory. Use "cd .." for parent and "cd ~" for home.', example: 'cd /home/student' },
  { name: 'pwd', syntax: 'pwd', category: 'Linux', explanation: 'Prints the absolute path of the current working directory.', example: 'pwd' },
  { name: 'mkdir', syntax: 'mkdir -p <dirname>', category: 'Linux', explanation: 'Creates directories, creating parent folders automatically with -p.', example: 'mkdir -p project/src' },
  { name: 'touch', syntax: 'touch <file>', category: 'Linux', explanation: 'Creates a new empty file or updates the timestamp of an existing file.', example: 'touch main.py' },
  { name: 'rm', syntax: 'rm -r <file/dir>', category: 'Linux', explanation: 'Removes files or directories recursively (-r). Exercise caution!', example: 'rm -rf ./build', safeNote: 'Never run "rm -rf /"!' },
  { name: 'cp', syntax: 'cp -r <src> <dst>', category: 'Linux', explanation: 'Copies files or directories (-r) to a destination path.', example: 'cp config.sample config.env' },
  { name: 'mv', syntax: 'mv <src> <dst>', category: 'Linux', explanation: 'Moves or renames files and directories.', example: 'mv old_name.txt new_name.txt' },
  { name: 'cat', syntax: 'cat <file>', category: 'Linux', explanation: 'Concatenates and displays file contents in the terminal.', example: 'cat /etc/os-release' },
  { name: 'less', syntax: 'less <file>', category: 'Linux', explanation: 'Views large files page-by-page with interactive navigation and search.', example: 'less /var/log/syslog' },
  { name: 'head', syntax: 'head -n <count> <file>', category: 'Linux', explanation: 'Outputs the first N lines of a text file (default 10).', example: 'head -n 20 data.csv' },
  { name: 'tail', syntax: 'tail -f <file>', category: 'Linux', explanation: 'Outputs the last lines of a file; -f actively follows real-time updates.', example: 'tail -f /var/log/auth.log' },
  { name: 'find', syntax: 'find <path> -name <pattern>', category: 'Linux', explanation: 'Searches directory trees for files matching names, sizes, or types.', example: 'find . -name "*.py" -size +10k' },
  { name: 'file', syntax: 'file <filename>', category: 'Linux', explanation: 'Inspects file headers to identify genuine MIME type and binary architecture.', example: 'file suspicious_blob' },
  { name: 'stat', syntax: 'stat <file>', category: 'Linux', explanation: 'Displays detailed inode metadata, file size, access permissions, and timestamps.', example: 'stat secret.key' },
  { name: 'tree', syntax: 'tree -L <depth>', category: 'Linux', explanation: 'Displays directories as an indented visual ASCII branch tree.', example: 'tree -L 2' },
  { name: 'du', syntax: 'du -sh <dir>', category: 'Linux', explanation: 'Disk usage: calculates cumulative directory size in human-readable format.', example: 'du -sh /home/*' },
  { name: 'df', syntax: 'df -h', category: 'Linux', explanation: 'Disk filesystem free space in human-readable gigabytes and percentage.', example: 'df -h' },

  // Linux Text Processing & Filters
  { name: 'grep', syntax: 'grep -inE <pattern> <file>', category: 'Linux', explanation: 'Searches for text matching regular expressions with line numbers (-n) and case insensitivity (-i).', example: 'grep -in "failed password" /var/log/auth.log' },
  { name: 'sed', syntax: 'sed "s/find/replace/g" <file>', category: 'Linux', explanation: 'Stream editor for filtering and transforming text lines programmatically.', example: 'sed "s/localhost/127.0.0.1/g" config.txt' },
  { name: 'awk', syntax: "awk '{print $1, $4}' <file>", category: 'Linux', explanation: 'Powerful pattern scanning and processing language for columnar log data.', example: "awk -F: '{print $1, $7}' /etc/passwd" },
  { name: 'cut', syntax: 'cut -d<delimiter> -f<fields>', category: 'Linux', explanation: 'Extracts specific delimited columns from text lines.', example: 'cut -d, -f1,3 users.csv' },
  { name: 'sort', syntax: 'sort -n -r <file>', category: 'Linux', explanation: 'Sorts text lines alphabetically or numerically (-n), in reverse (-r).', example: 'sort -u ip_list.txt' },
  { name: 'uniq', syntax: 'uniq -c -u', category: 'Linux', explanation: 'Filters adjacent matching lines; -c counts duplicates, -u prints unique lines only.', example: 'sort ips.txt | uniq -c | sort -nr' },
  { name: 'wc', syntax: 'wc -l <file>', category: 'Linux', explanation: 'Word count: prints newline count (-l), word count (-w), or byte count (-c).', example: 'wc -l /etc/passwd' },
  { name: 'tr', syntax: 'tr <set1> <set2>', category: 'Linux', explanation: 'Translates, squeezes, or deletes characters from standard input (e.g. ROT13 or casing).', example: 'cat msg.txt | tr "A-Za-z" "N-ZA-Mn-za-m"' },
  { name: 'tee', syntax: 'command | tee <file>', category: 'Linux', explanation: 'Reads from stdin and writes simultaneously to stdout and files.', example: 'make | tee build.log' },
  { name: 'diff', syntax: 'diff -u <file1> <file2>', category: 'Linux', explanation: 'Compares two files line by line and outputs unified differences.', example: 'diff -u old.c new.c' },
  { name: 'xargs', syntax: 'xargs <command>', category: 'Linux', explanation: 'Builds and executes command lines from standard input items.', example: 'find . -name "*.tmp" | xargs rm' },

  // Linux Permissions & User Identity
  { name: 'chmod', syntax: 'chmod <mode> <file>', category: 'Linux', explanation: 'Changes file access permissions using octal (755, 600) or symbolic (u+x, go-w) notation.', example: 'chmod 600 id_rsa', safeNote: 'Avoid chmod 777 in production' },
  { name: 'chown', syntax: 'chown <user>:<group> <file>', category: 'Linux', explanation: 'Changes the owner and group ownership of files and directories.', example: 'sudo chown -R www-data:www-data /var/www' },
  { name: 'umask', syntax: 'umask 027', category: 'Linux', explanation: 'Sets default permission mask for newly created files and directories.', example: 'umask 022' },
  { name: 'whoami', syntax: 'whoami', category: 'Linux', explanation: 'Prints the effective username of the currently logged-in user.', example: 'whoami' },
  { name: 'id', syntax: 'id [user]', category: 'Linux', explanation: 'Prints user ID (UID), primary group ID (GID), and all supplementary groups.', example: 'id bandit0' },
  { name: 'sudo', syntax: 'sudo <command>', category: 'Linux', explanation: 'Executes a command with superuser (root) administrative security privileges.', example: 'sudo systemctl restart nginx' },

  // Linux Process & Monitoring
  { name: 'ps', syntax: 'ps aux', category: 'System', explanation: 'Reports snapshot of all current running processes with CPU and RAM usage.', example: 'ps aux | grep python' },
  { name: 'top', syntax: 'top', category: 'System', explanation: 'Interactive real-time monitor displaying CPU, RAM, and active process threads.', example: 'top' },
  { name: 'htop', syntax: 'htop', category: 'System', explanation: 'Modern colored, interactive process viewer with mouse support and scrollable tree.', example: 'htop' },
  { name: 'kill', syntax: 'kill -9 <PID>', category: 'System', explanation: 'Sends termination signals to processes (SIGTERM 15, SIGKILL 9).', example: 'kill -15 1420' },
  { name: 'pkill', syntax: 'pkill -f <pattern>', category: 'System', explanation: 'Terminates processes matching a specified process name or regex command line.', example: 'pkill -f node' },
  { name: 'free', syntax: 'free -m', category: 'System', explanation: 'Displays total, used, free, and cached physical RAM and swap space in megabytes.', example: 'free -h' },
  { name: 'uptime', syntax: 'uptime', category: 'System', explanation: 'Shows how long the system has been running, user count, and load averages.', example: 'uptime' },
  { name: 'journalctl', syntax: 'journalctl -u <service> -f', category: 'System', explanation: 'Queries and follows systemd journal logs for services and kernel events.', example: 'journalctl -u ssh -n 50' },
  { name: 'systemctl', syntax: 'systemctl status <service>', category: 'System', explanation: 'Controls systemd services (start, stop, restart, enable, status).', example: 'systemctl status ufw' },
  { name: 'lsof', syntax: 'lsof -i :<port>', category: 'System', explanation: 'Lists open files and network sockets associated with active processes.', example: 'lsof -i :8080' },

  // Networking & Web Commands
  { name: 'ip', syntax: 'ip addr show', category: 'Networking', explanation: 'Modern Linux network tool for inspecting IP addresses, interfaces, and routes.', example: 'ip a show eth0' },
  { name: 'ping', syntax: 'ping -c <count> <host>', category: 'Networking', explanation: 'Sends ICMP ECHO_REQUEST packets to verify reachability and round-trip latency.', example: 'ping -c 4 8.8.8.8' },
  { name: 'traceroute', syntax: 'traceroute <host>', category: 'Networking', explanation: 'Tracks the network hop path and transit delays of packets across routers.', example: 'traceroute cloudflare.com' },
  { name: 'ss', syntax: 'ss -tulpn', category: 'Networking', explanation: 'Modern socket statistics: lists listening TCP/UDP ports and owning process IDs.', example: 'ss -tulpn' },
  { name: 'netstat', syntax: 'netstat -tuln', category: 'Networking', explanation: 'Legacy network statistics utility displaying listening sockets and routing tables.', example: 'netstat -an | grep 443' },
  { name: 'curl', syntax: 'curl -i <url>', category: 'Networking', explanation: 'Transfers data with URLs; -i displays HTTP response headers alongside payload.', example: 'curl -I https://google.com' },
  { name: 'wget', syntax: 'wget <url>', category: 'Networking', explanation: 'Non-interactive network downloader that retrieves files from web and FTP servers.', example: 'wget https://example.com/data.tar.gz' },
  { name: 'nc (netcat)', syntax: 'nc -zv <host> <port>', category: 'Networking', explanation: 'Swiss Army knife: reads and writes raw TCP/UDP network connections.', example: 'nc -lvnp 4444' },
  { name: 'nmap', syntax: 'nmap -sV -sC -p- <target>', category: 'Networking', explanation: 'Security scanner for host discovery, port scanning, and service version fingerprinting.', example: 'nmap -sV 192.168.1.1', safeNote: 'Only scan authorized systems' },
  { name: 'tcpdump', syntax: 'tcpdump -i <interface> -nn port 80', category: 'Networking', explanation: 'Command-line packet analyzer that captures raw network traffic headers and payloads.', example: 'tcpdump -i any -c 10' },
  { name: 'dig', syntax: 'dig <domain> [A|MX|TXT]', category: 'Networking', explanation: 'DNS lookup utility querying nameservers for DNS resource records.', example: 'dig google.com A' },
  { name: 'ssh', syntax: 'ssh -i <key> <user>@<host>', category: 'Networking', explanation: 'Secure Shell: encrypted remote shell login and command execution protocol.', example: 'ssh -p 2220 bandit0@bandit.labs.overthewire.org' },
  { name: 'scp', syntax: 'scp <file> <user>@<host>:<path>', category: 'Networking', explanation: 'Securely copies files between local and remote hosts using SSH encryption.', example: 'scp lab.py student@server:~/labs/' },

  // Archives & Compression
  { name: 'tar', syntax: 'tar -czvf <archive.tar.gz> <dir>', category: 'Linux', explanation: 'Creates or extracts (-xzvf) gzipped tar archives.', example: 'tar -xzvf archive.tar.gz' },
  { name: 'gzip', syntax: 'gzip <file>', category: 'Linux', explanation: 'Compresses files using the LZ77/Huffman DEFLATE algorithm (creates .gz).', example: 'gzip data.txt' },
  { name: 'gunzip', syntax: 'gunzip <file.gz>', category: 'Linux', explanation: 'Decompresses .gz compressed files back to original files.', example: 'gunzip data.txt.gz' },
  { name: 'zip', syntax: 'zip -r <archive.zip> <dir>', category: 'Linux', explanation: 'Packages and compresses directories into cross-platform .zip archives.', example: 'zip -r project.zip src/' },
  { name: 'unzip', syntax: 'unzip <archive.zip>', category: 'Linux', explanation: 'Extracts compressed files from a ZIP archive.', example: 'unzip package.zip' },

  // Security, Cryptography & Binary Tools
  { name: 'strings', syntax: 'strings <file>', category: 'Security', explanation: 'Extracts printable character sequences (length >= 4) from compiled binary files.', example: 'strings a.out | grep "pass"' },
  { name: 'base64', syntax: 'base64 -d <file>', category: 'Security', explanation: 'Encodes or decodes (-d) data to and from ASCII Base64 format.', example: 'echo "secret" | base64' },
  { name: 'xxd', syntax: 'xxd <file>', category: 'Security', explanation: 'Creates a hex dump of a binary file or reverses (-r) a hex dump back to binary.', example: 'xxd -r hexdump.txt binary_out' },
  { name: 'sha256sum', syntax: 'sha256sum <file>', category: 'Security', explanation: 'Computes cryptographic SHA-256 hash manifest to verify data integrity.', example: 'sha256sum ubuntu.iso' },
  { name: 'md5sum', syntax: 'md5sum <file>', category: 'Security', explanation: 'Computes MD5 hash checksum (note: MD5 is broken for security, use SHA-256).', example: 'md5sum archive.zip' },
  { name: 'openssl', syntax: 'openssl s_client -connect <host>:<port>', category: 'Security', explanation: 'Cryptography toolkit for SSL/TLS debugging, certificates, and ciphers.', example: 'openssl s_client -connect google.com:443' },
  { name: 'gdb', syntax: 'gdb ./program', category: 'Security', explanation: 'GNU Project Debugger for setting breakpoints, inspecting registers, and memory.', example: 'gdb ./a.out' },
  { name: 'objdump', syntax: 'objdump -d -M intel <binary>', category: 'Security', explanation: 'Disassembles binary machine code into human-readable assembly instructions.', example: 'objdump -d a.out' },

  // Git Version Control
  { name: 'git init', syntax: 'git init', category: 'Git', explanation: 'Initializes a new empty Git version control repository in the current folder.', example: 'git init' },
  { name: 'git status', syntax: 'git status', category: 'Git', explanation: 'Shows the working tree status, staged files, unstaged changes, and untracked files.', example: 'git status' },
  { name: 'git add', syntax: 'git add <path/pattern>', category: 'Git', explanation: 'Stages modified or new files into the index ready for the next commit.', example: 'git add .' },
  { name: 'git commit', syntax: 'git commit -m "<message>"', category: 'Git', explanation: 'Records staged snapshot permanently into repository history with a message.', example: 'git commit -m "feat: implement password hash"' },
  { name: 'git log', syntax: 'git log --oneline --graph', category: 'Git', explanation: 'Displays commit history log with hashes, author dates, and visual branch graphs.', example: 'git log -n 5 --oneline' },
  { name: 'git branch', syntax: 'git branch -a', category: 'Git', explanation: 'Lists all local and remote branches; creates a new branch if name provided.', example: 'git branch feature-auth' },
  { name: 'git switch', syntax: 'git switch -c <branch>', category: 'Git', explanation: 'Switches branches or creates and checks out a new branch (-c).', example: 'git switch -c fix-parser' },
  { name: 'git push', syntax: 'git push origin <branch>', category: 'Git', explanation: 'Uploads local branch commits to a remote Git hosting repository (like GitHub).', example: 'git push -u origin main' },
  { name: 'git pull', syntax: 'git pull origin <branch>', category: 'Git', explanation: 'Fetches from and integrates with remote repository or branch automatically.', example: 'git pull' },
  { name: 'git diff', syntax: 'git diff [file]', category: 'Git', explanation: 'Shows line-by-line differences between working tree and staged index or commits.', example: 'git diff HEAD~1' },
  { name: 'git stash', syntax: 'git stash [pop]', category: 'Git', explanation: 'Temporarily shelves dirty working directory changes for later re-application.', example: 'git stash pop' },

  // Compilers & Dev Tools
  { name: 'gcc', syntax: 'gcc -Wall -Wextra -Werror -o <out> <src.c>', category: 'C/C++', explanation: 'Compiles C source code with strict warnings enabled and creates an executable binary.', example: 'gcc -Wall -o server main.c' },
  { name: 'g++', syntax: 'g++ -std=c++20 -Wall -o <out> <src.cpp>', category: 'C/C++', explanation: 'Compiles modern C++ source code using the specified standard library version.', example: 'g++ -std=c++20 -o app main.cpp' },
  { name: 'valgrind', syntax: 'valgrind --leak-check=full ./program', category: 'C/C++', explanation: 'Memory debugging tool that detects memory leaks, invalid reads, and buffer errors in C.', example: 'valgrind --leak-check=full ./parser' },
  { name: 'make', syntax: 'make [target]', category: 'Dev', explanation: 'Build automation tool executing rules from a Makefile based on file timestamps.', example: 'make build' },
  { name: 'python3', syntax: 'python3 <script.py>', category: 'Dev', explanation: 'Runs Python interpreter scripts or inline commands with -c.', example: 'python3 -m http.server 8000' },
  { name: 'pip', syntax: 'pip install <package>', category: 'Dev', explanation: 'The standard package installer for Python libraries from PyPI.', example: 'pip install requests flask' },
  { name: 'node', syntax: 'node <script.js>', category: 'Dev', explanation: 'Executes server-side JavaScript code using Google Chrome’s V8 runtime.', example: 'node index.js' },
  { name: 'npm', syntax: 'npm run <script>', category: 'Dev', explanation: 'Node Package Manager: manages project dependencies and lifecycle scripts.', example: 'npm install' },

  // SQL & Relational Databases
  { name: 'sqlite3', syntax: 'sqlite3 <database.db>', category: 'SQL', explanation: 'Opens an interactive CLI session with a self-contained local SQLite database.', example: 'sqlite3 telemetry.db' },
  { name: 'SELECT', syntax: 'SELECT col1, col2 FROM table WHERE condition;', category: 'SQL', explanation: 'Retrieves data rows from one or more database tables.', example: 'SELECT username, email FROM users WHERE active = 1;' },
  { name: 'INSERT', syntax: 'INSERT INTO table (col1) VALUES (?);', category: 'SQL', explanation: 'Inserts new data records into a database table.', example: 'INSERT INTO logs (event, ip) VALUES ("login", "127.0.0.1");' },
  { name: 'UPDATE', syntax: 'UPDATE table SET col = val WHERE condition;', category: 'SQL', explanation: 'Modifies existing records in a database table safely.', example: 'UPDATE users SET verified = 1 WHERE id = 42;' },
  { name: 'DELETE', syntax: 'DELETE FROM table WHERE condition;', category: 'SQL', explanation: 'Deletes records matching condition from a table.', example: 'DELETE FROM sessions WHERE expired = 1;' },
  { name: 'JOIN', syntax: 'SELECT * FROM A INNER JOIN B ON A.id = B.a_id;', category: 'SQL', explanation: 'Combines rows from two or more tables based on a related column.', example: 'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;' },

  // Docker & Containers
  { name: 'docker run', syntax: 'docker run -d -p <host>:<container> <image>', category: 'Docker', explanation: 'Spins up and executes a new isolated container from a Docker image.', example: 'docker run -d -p 80:80 nginx:alpine' },
  { name: 'docker ps', syntax: 'docker ps -a', category: 'Docker', explanation: 'Lists active and stopped (-a) container processes, status, and ports.', example: 'docker ps -a' },
  { name: 'docker build', syntax: 'docker build -t <tag> .', category: 'Docker', explanation: 'Builds an isolated container image from a Dockerfile.', example: 'docker build -t lab-sandbox:1.0 .' },
  { name: 'docker exec', syntax: 'docker exec -it <container> /bin/bash', category: 'Docker', explanation: 'Runs an interactive command or bash shell inside a live container.', example: 'docker exec -it web-app sh' },
  { name: 'docker stop', syntax: 'docker stop <container>', category: 'Docker', explanation: 'Gracefully terminates a running container.', example: 'docker stop web-app' }
];

export const CERT_STATUS_TABLE = [
  {
    name: 'Fortinet NSE 1, 2, 3 (Training Institute)',
    url: 'https://training.fortinet.com',
    status: 'Still Free',
    isFree: true,
    details: 'Self-paced cybersecurity awareness courses and digital completion badges. Valid 2 years.'
  },
  {
    name: 'Cisco: Introduction to Cybersecurity',
    url: 'https://www.netacad.com',
    status: 'Still Free',
    isFree: true,
    details: 'Free course with an official Credly digital badge after passing the final assessment.'
  },
  {
    name: 'AttackIQ Foundations Badges',
    url: 'https://academy.attackiq.com',
    status: 'Still Free',
    isFree: true,
    details: 'Six modular courses covering purple teaming, MITRE ATT&CK, and threat intelligence with badges.'
  },
  {
    name: 'Centri Blue Team Junior Analyst (BTJA)',
    url: 'https://centri.org',
    status: 'Still Free',
    isFree: true,
    details: 'Free six-course pathway covering Wireshark, logs, and CyberChef with certificate of completion.'
  },
  {
    name: 'IBM Cybersecurity Fundamentals (SkillsBuild)',
    url: 'https://skillsbuild.org',
    status: 'Still Free',
    isFree: true,
    details: 'Free digital Credly badge awarded after scoring 80% or higher on the comprehensive exam.'
  },
  {
    name: 'OPSWAT Intro to Critical Infrastructure (CIP)',
    url: 'https://opswatacademy.com',
    status: 'Still Free',
    isFree: true,
    details: 'Short course on critical infrastructure protection; $0 through the official enroll link.'
  },
  {
    name: 'freeCodeCamp Certifications',
    url: 'https://www.freecodecamp.org',
    status: 'Still Free',
    isFree: true,
    details: '100% free verified certifications for completing 5 required projects in Python, Web, and SQL.'
  },
  {
    name: 'ISC2 Certified in Cybersecurity (CC)',
    url: 'https://www.isc2.org',
    status: 'Free Program Closed (Now Paid)',
    isFree: false,
    details: 'CLOSED on 20 May 2026. Only existing code holders can sit by 31 Dec 2026. Standard exam is now paid (~$199) + $50 annual maintenance fee.'
  },
  {
    name: 'Google Cybersecurity Certificate (Coursera)',
    url: 'https://www.coursera.org',
    status: 'Free to Audit / Paid Certificate',
    isFree: false,
    details: 'All course lessons and videos are free to audit. Certificate costs ~$49/mo (financial aid available).'
  },
  {
    name: 'Microsoft SC-900 (Security Fundamentals)',
    url: 'https://learn.microsoft.com',
    status: 'Free Training / Paid Exam',
    isFree: false,
    details: 'All interactive training modules on Microsoft Learn are completely free. The proctored exam voucher is ~$99.'
  },
  {
    name: 'CompTIA Security+',
    url: 'https://www.comptia.org',
    status: 'Standard Paid Proctored Exam',
    isFree: false,
    details: 'Industry entry-level credential. Voucher is ~$439 (look for student academic discounts or university vouchers).'
  },
  {
    name: 'EC-Council Essentials (NDE, EHE, DFE)',
    url: 'https://www.eccouncil.org',
    status: 'No Longer Free',
    isFree: false,
    details: 'Old free offerings ended; now priced at $299 each. Do not rely on outdated free certification lists.'
  },
  {
    name: 'SANS Cyber Aces',
    url: 'https://www.sans.org',
    status: 'Retired in June 2023',
    isFree: false,
    details: 'Retired program. Check SANS blog and open webcasts for active free resources.'
  }
];

export const TROUBLESHOOTING_GUIDE: TroubleshootingItem[] = [
  {
    problem: 'I know the words but cannot build anything from scratch.',
    solution: 'Reduce the scope drastically. Open a blank file and implement only ONE tiny behavior (e.g. print user name). Add tests and add one single feature at a time.'
  },
  {
    problem: 'Every tutorial online uses different commands.',
    solution: 'Learn the underlying concept and consult official documentation. Commands and flags vary by operating system, package versions, and shells.'
  },
  {
    problem: 'I feel behind because other people solve CTFs faster.',
    solution: 'Compare your present skills only to your past self. Write-ups often hide dozens of failed attempts; speed is not the only measure of an engineer.'
  },
  {
    problem: 'I am stuck on an error and feel frustrated.',
    solution: 'Copy the full error into your study notebook. Read the very last line first, isolate a minimal reproducible example, check types, and change one variable at a time.'
  },
  {
    problem: 'I want to learn Python, C++, Linux, cloud, and hacking all at once.',
    solution: 'Pick ONE main goal for 6 weeks. Maintain a "Curiosity List" for exciting side topics; only revisit them once your main milestone is achieved.'
  },
  {
    problem: 'I cannot install heavy Virtual Machines on my laptop.',
    solution: 'Use our built-in in-browser terminal simulator and browser platforms (TryHackMe, PortSwigger, Replit). You can master 90% of foundations before needing a heavy local VM.'
  },
  {
    problem: 'I have little money for expensive courses or certifications.',
    solution: 'Use verified free resources: CS50, Linux Journey, NetAcad, Khan Academy, and open-source tools. Never pay for certifications until you have mastered free fundamentals.'
  },
  {
    problem: 'AI generated code that I do not understand.',
    solution: 'Ask the AI tutor for a conceptual hint or analogy, then close the window and implement your own version. Never publish or submit code you cannot explain.'
  },
  {
    problem: 'A security tool flags an alert but I do not know if it is real.',
    solution: 'Treat tool alerts as hypotheses. Verify context, reproduce the issue in an authorized lab, inspect raw evidence, and document uncertainty.'
  },
  {
    problem: 'I am bored with pure theory.',
    solution: 'Build a small real-world project that forces the concept to be used (e.g. build a binary bit flipper or password checker), then return to theory to understand the result.'
  }
];

export const WEEKLY_SCHEDULE_ROUTINE = [
  { day: 'Monday', hours: '1.5 h', focus: 'Programming lesson and exercises', deliverable: 'Save 3 small working functions' },
  { day: 'Tuesday', hours: '1.5 h', focus: 'Current stage concept (architecture, Linux, or network)', deliverable: '5-8 recall notes and 1 question' },
  { day: 'Wednesday', hours: '1.5 h', focus: 'Programming practice; re-implement without copying', deliverable: 'Corrected exercise with test case' },
  { day: 'Thursday', hours: '1.5 h', focus: 'Networking or security guided lab', deliverable: 'Short lab log, diagram, or quiz score' },
  { day: 'Friday', hours: '1.0 h', focus: 'Review technical English glossary and notes', deliverable: 'Glossary flashcard review' },
  { day: 'Saturday', hours: '3.0 h', focus: 'Hands-on project, Bandit wargame, or CTF lab', deliverable: 'One Git commit and documented README update' },
  { day: 'Sunday', hours: '1.0 h', focus: 'Weekly 6-question reflection & planning next week', deliverable: 'Saved weekly review log + rest' }
];

export interface AdvancedHeroTopic {
  id: string;
  subjectArea:
    | 'Algorithms & Data Structures'
    | 'Operating Systems & Concurrency'
    | 'Databases & Relational Theory'
    | 'Computer Networking & Protocols'
    | 'Software Engineering & System Design'
    | 'Distributed Systems & Cloud Architecture'
    | 'Systems Security & Cryptography';
  title: string;
  badge: string;
  overview: string;
  keyConcepts: string[];
  keyCommands: Array<{ command: string; purpose: string }>;
  recommendedSources: Array<{
    title: string;
    authorOrPlatform: string;
    type: 'Book' | 'Course' | 'Paper' | 'Documentation';
    url: string;
    isClassic?: boolean;
    notes: string;
  }>;
  essentialTips: string[];
  sampleCodeSnippet?: {
    language: 'python' | 'c';
    code: string;
    description: string;
  };
}

export const ADVANCED_HERO_TOPICS: AdvancedHeroTopic[] = [
  {
    id: 'hero-dsa',
    subjectArea: 'Algorithms & Data Structures',
    title: 'Asymptotics, Graph Traversals & Dynamic Programming',
    badge: 'Core Theory',
    overview: 'The mathematical spine of computer science. Moving beyond basic arrays into balanced search trees, heaps, amortized analysis, graph traversals (BFS, DFS, Dijkstra, A*), and dynamic programming paradigms.',
    keyConcepts: [
      'Big-O, Big-Omega, Big-Theta Asymptotic Notation & Recurrence Relations (Master Theorem)',
      'Hash Tables, Collision Resolution (Open Addressing vs Chaining), and Universal Hashing',
      'Self-Balancing Binary Search Trees (AVL, Red-Black Trees, B-Trees)',
      'Graph Representations (Adjacency Matrix vs List), Shortest Paths & Topological Sort',
      'Dynamic Programming: Memoization (Top-down) vs Tabulation (Bottom-up), Overlapping Subproblems'
    ],
    keyCommands: [
      { command: 'python3 -m cProfile -s time script.py', purpose: 'Profiles code runtime to identify algorithmic hot-spots' },
      { command: 'time ./a.out', purpose: 'Measures real, user, and sys CPU execution time' },
      { command: 'dot -Tsvg graph.dot -o graph.svg', purpose: 'Visualizes graph data structures from Graphviz definitions' }
    ],
    recommendedSources: [
      {
        title: 'Introduction to Algorithms (CLRS)',
        authorOrPlatform: 'Cormen, Leiserson, Rivest, Stein (MIT Press)',
        type: 'Book',
        url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
        isClassic: true,
        notes: 'The undisputed gold standard collegiate algorithm textbook.'
      },
      {
        title: 'MIT 6.006: Introduction to Algorithms',
        authorOrPlatform: 'MIT OpenCourseWare (Prof. Erik Demaine)',
        type: 'Course',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        isClassic: true,
        notes: 'Free, world-class lecture series covering asymptotic analysis and data structures.'
      },
      {
        title: 'Grokking Algorithms: An Illustrated Guide',
        authorOrPlatform: 'Aditya Bhargava',
        type: 'Book',
        url: 'https://www.manning.com/books/grokking-algorithms',
        notes: 'Visual, intuitive introduction to sorting, graphs, and dynamic programming.'
      }
    ],
    essentialTips: [
      'Always state your invariant and base case on paper before writing a single line of recursion.',
      'Space-time tradeoffs are real: caching results (memoization) costs RAM to save CPU cycles.',
      'Recognize graph problems in disguise: dependency resolution, state transitions, and mazes are all graphs.'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'Dynamic Programming: Longest Increasing Subsequence with memoization',
      code: `def longest_increasing_subsequence(nums):
    if not nums:
        return 0
    # dp[i] stores the length of LIS ending at index i
    dp = [1] * len(nums)
    for i in range(1, len(nums)):
        for j in range(i):
            if nums[i] > nums[j]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

arr = [10, 9, 2, 5, 3, 7, 101, 18]
print(f"Array: {arr}")
print(f"Length of Longest Increasing Subsequence: {longest_increasing_subsequence(arr)}")
`
    }
  },
  {
    id: 'hero-os',
    subjectArea: 'Operating Systems & Concurrency',
    title: 'Kernel Architecture, Virtual Memory & Concurrency',
    badge: 'Systems Bedrock',
    overview: 'Understanding the barrier between user space and kernel space. How the CPU collaborates with the Memory Management Unit (MMU) for virtual memory paging, process scheduling, synchronization primitives (mutexes, semaphores), and inter-process communication.',
    keyConcepts: [
      'Kernel vs User Mode (Ring 0 vs Ring 3), CPU Context Switching & System Calls',
      'Virtual Memory: Page Tables, Translation Lookaside Buffer (TLB), Page Faults & Demand Paging',
      'Processes vs Threads: Memory Layout, Stack vs Heap, Thread Local Storage (TLS)',
      'Concurrency Hazards: Race Conditions, Deadlocks (Coffman Conditions), Priority Inversion',
      'Synchronization Primitives: Mutexes, Spinlocks, Semaphores, Condition Variables'
    ],
    keyCommands: [
      { command: 'strace -c ./program', purpose: 'Intercepts and counts all Linux system calls executed by a process' },
      { command: 'lsof -p <PID>', purpose: 'Lists all open file descriptors and sockets held by a process' },
      { command: 'valgrind --leak-check=full ./a.out', purpose: 'Detects memory leaks, double-frees, and invalid pointer dereferences' },
      { command: 'pmap -x <PID>', purpose: 'Displays the virtual memory address map of a running process' }
    ],
    recommendedSources: [
      {
        title: 'Operating Systems: Three Easy Pieces (OSTEP)',
        authorOrPlatform: 'Remzi & Andrea Arpaci-Dusseau (University of Wisconsin)',
        type: 'Book',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        isClassic: true,
        notes: 'Freely available, witty, and exceptionally clear textbook on Virtualization, Concurrency, and Persistence.'
      },
      {
        title: 'Computer Systems: A Programmer\'s Perspective (CS:APP)',
        authorOrPlatform: 'Bryant & O\'Hallaron (Carnegie Mellon)',
        type: 'Book',
        url: 'https://csapp.cs.cmu.edu/',
        isClassic: true,
        notes: 'The definitive book bridging assembly, compilers, caching, linking, and OS concepts.'
      }
    ],
    essentialTips: [
      'In Linux, everything is an abstraction of a file descriptor or a process task.',
      'Never lock mutexes in differing order across threads; always establish a global lock acquisition hierarchy to prevent deadlocks.',
      'Use strace to uncover mysterious bugs: it reveals the exact syscall parameters and return errors.'
    ],
    sampleCodeSnippet: {
      language: 'c',
      description: 'System calls in C: Forking child processes and handling wait status',
      code: `#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();
    
    if (pid < 0) {
        perror("Fork failed");
        return 1;
    } else if (pid == 0) {
        // Child process
        printf("[Child PID %d] Hello from the child process! Parent is PID %d\\n", getpid(), getppid());
        _exit(42);
    } else {
        // Parent process
        int status;
        waitpid(pid, &status, 0);
        if (WIFEXITED(status)) {
            printf("[Parent PID %d] Child process %d exited cleanly with code: %d\\n", getpid(), pid, WEXITSTATUS(status));
        }
    }
    return 0;
}
`
    }
  },
  {
    id: 'hero-databases',
    subjectArea: 'Databases & Relational Theory',
    title: 'Relational Algebra, B+ Trees, ACID & Storage Engines',
    badge: 'Data Engineering',
    overview: 'How database engines persist petabytes of data reliably while answering queries in milliseconds. Delving into the Relational Model, B+ Tree indexing, Write-Ahead Logging (WAL) for durability, transaction isolation levels, and query execution plans.',
    keyConcepts: [
      'Relational Algebra: Select, Project, Join, Set Operations, and Codd\'s Relational Model',
      'Storage Engines & Page Layout: Row-oriented (Postgres) vs Columnar (Parquet/ClickHouse)',
      'Index Structures: B+ Trees (range queries) vs Hash Indexes vs Inverted Indexes (Full-Text)',
      'ACID Guarantees: Atomicity, Consistency, Isolation (Dirty Read, Non-repeatable Read, Phantom Read), Durability',
      'Query Optimizer: Cost-based query plans, Sequential Scan vs Index Scan, Hash Join vs Nested Loop'
    ],
    keyCommands: [
      { command: 'psql -U postgres -d odyssey -c "\\d+ users"', purpose: 'Inspects relational table schema, column types, and indices' },
      { command: 'EXPLAIN (ANALYZE, BUFFERS) SELECT ...', purpose: 'Executes query and displays exact execution plan, buffer hits, and timing' },
      { command: 'sqlite3 local.db ".schema"', purpose: 'Dumps SQLite relational schema and index definitions' }
    ],
    recommendedSources: [
      {
        title: 'Designing Data-Intensive Applications (DDIA)',
        authorOrPlatform: 'Martin Kleppmann (Cambridge University / O\'Reilly)',
        type: 'Book',
        url: 'https://dataintensive.net/',
        isClassic: true,
        notes: 'The modern bible of data architecture: storage engines, transactions, replication, and consensus.'
      },
      {
        title: 'CMU 15-445/645: Database Systems',
        authorOrPlatform: 'Prof. Andy Pavlo (Carnegie Mellon Database Group)',
        type: 'Course',
        url: 'https://15445.courses.cs.cmu.edu/',
        isClassic: true,
        notes: 'Legendary hands-on course building a storage engine and query executor from scratch in C++.'
      }
    ],
    essentialTips: [
      'Indices are not free: they accelerate SELECT queries by O(log N) but add overhead to every INSERT/UPDATE/DELETE.',
      'Always run EXPLAIN ANALYZE on slow queries before blindly adding indexes or rewriting code.',
      'Understand transaction isolation levels: Read Committed vs Repeatable Read vs Serializable.'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'In-memory relational B-Tree index lookup simulation',
      code: `import bisect

class SimpleBTreeIndex:
    def __init__(self):
        self.keys = []
        self.record_ids = []

    def insert(self, key, record_id):
        idx = bisect.bisect_left(self.keys, key)
        self.keys.insert(idx, key)
        self.record_ids.insert(idx, record_id)

    def find_range(self, min_key, max_key):
        start = bisect.bisect_left(self.keys, min_key)
        end = bisect.bisect_right(self.keys, max_key)
        return [(self.keys[i], self.record_ids[i]) for i in range(start, end)]

# Indexing 1000 simulated student records
index = SimpleBTreeIndex()
for uid, score in enumerate([72, 85, 99, 64, 91, 88, 95, 78, 100, 83], 101):
    index.insert(score, f"Student-{uid}")

high_performers = index.find_range(90, 100)
print("Query: Students with score between 90 and 100 (Indexed Range Scan):")
for score, student in high_performers:
    print(f"  Score {score} -> {student}")
`
    }
  },
  {
    id: 'hero-networking',
    subjectArea: 'Computer Networking & Protocols',
    title: 'OSI 7 Layers, TCP/IP Handshake, Sockets & TLS 1.3',
    badge: 'Infrastructure',
    overview: 'Demystifying how data traverses the global internet. The layered architecture (Physical to Application), IP packet routing, TCP reliable byte stream delivery, UDP low-latency transport, socket programming in C, DNS resolution, and cryptographic TLS handshakes.',
    keyConcepts: [
      'Layered Architecture: OSI 7-Layer Model vs TCP/IP 4-Layer Internet Model',
      'Network Layer (IPv4/IPv6): Subnetting (CIDR), Routing Tables, ARP, ICMP (Ping/Traceroute)',
      'Transport Layer (TCP vs UDP): 3-Way Handshake (SYN, SYN-ACK, ACK), Flow Control, Sliding Window',
      'BSD Socket API: socket(), bind(), listen(), accept(), connect(), send(), recv()',
      'Application Security & TLS: Diffie-Hellman Key Exchange, Digital Certificates (X.509), TLS 1.3'
    ],
    keyCommands: [
      { command: 'tcpdump -nnvv -i any port 80 or port 443', purpose: 'Captures and displays raw network packet headers in real-time' },
      { command: 'ss -tulpn', purpose: 'Displays all listening TCP/UDP sockets and owning process IDs' },
      { command: 'curl -vvv --tlsv1.3 https://example.com', purpose: 'Verbose TLS 1.3 handshake negotiation inspection' },
      { command: 'dig +trace example.com', purpose: 'Performs hierarchical iterative DNS resolution from root servers down' }
    ],
    recommendedSources: [
      {
        title: 'Computer Networking: A Top-Down Approach',
        authorOrPlatform: 'Kurose & Ross (Pearson)',
        type: 'Book',
        url: 'https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000003310',
        isClassic: true,
        notes: 'The world\'s most popular university networking textbook.'
      },
      {
        title: 'Beej\'s Guide to Network Programming',
        authorOrPlatform: 'Brian "Beej" Hall',
        type: 'Documentation',
        url: 'https://beej.us/guide/bgnet/',
        isClassic: true,
        notes: 'The legendary free guide for mastering C sockets and client-server architectures.'
      }
    ],
    essentialTips: [
      'Packets can be duplicated, reordered, delayed, or dropped; TCP exists precisely to create an illusion of order.',
      'Remember that DNS caching occurs at multiple tiers: browser, OS resolver, home router, and ISP recursive resolver.',
      'Firewall rules operate on bitmasks: understanding port numbers and TCP flags (SYN, ACK, FIN, RST) is critical for cybersecurity.'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'Raw TCP client socket: Fetching an HTTP header without external libraries',
      code: `import socket

host = "example.com"
port = 80

print(f"Connecting raw TCP socket to {host}:{port}...")
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.settimeout(5.0)
    s.connect((host, port))
    
    # Send minimal HTTP/1.1 HEAD request
    request = f"HEAD / HTTP/1.1\\r\\nHost: {host}\\r\\nConnection: close\\r\\n\\r\\n"
    s.sendall(request.encode("ascii"))
    
    response = b""
    while True:
        chunk = s.recv(1024)
        if not chunk:
            break
        response += chunk

print("\\n[Server Response Headers]:")
print(response.decode("utf-8", errors="replace").strip())
`
    }
  },
  {
    id: 'hero-software-eng',
    subjectArea: 'Software Engineering & System Design',
    title: 'Clean Architecture, SOLID, Design Patterns & Distributed Systems',
    badge: 'Production Systems',
    overview: 'Transitioning from writing code that merely runs to designing robust, maintainable, and scalable systems. Mastering SOLID principles, design patterns (Factory, Observer, Strategy), testing methodologies, containerization, and distributed system trade-offs (CAP theorem).',
    keyConcepts: [
      'SOLID Principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion',
      'GoF Design Patterns: Creational (Factory), Structural (Adapter, Decorator), Behavioral (Strategy, Observer)',
      'Clean Architecture: Decoupling business logic from frameworks, databases, and UI',
      'Distributed Systems Trade-offs: CAP Theorem (Consistency, Availability, Partition Tolerance), Eventual Consistency',
      'DevOps & Resilience: Automated CI/CD pipelines, containerization (Docker), Circuit Breaker pattern'
    ],
    keyCommands: [
      { command: 'pytest -v --cov=. tests/', purpose: 'Executes automated unit tests with code coverage analysis' },
      { command: 'docker build -t app:v1 . && docker run -p 8080:80 app:v1', purpose: 'Builds and runs an isolated containerized application' },
      { command: 'git diff --stat HEAD~1', purpose: 'Inspects changes and scope of modifications before code review' }
    ],
    recommendedSources: [
      {
        title: 'Clean Code & Clean Architecture',
        authorOrPlatform: 'Robert C. Martin (Uncle Bob)',
        type: 'Book',
        url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/',
        isClassic: true,
        notes: 'Fundamental principles for writing readable, refactorable, and professional code.'
      },
      {
        title: 'System Design Interview: An Insider\'s Guide',
        authorOrPlatform: 'Alex Xu (ByteByteGo)',
        type: 'Book',
        url: 'https://bytebytego.com/',
        notes: 'Invaluable diagrams and architectural breakdowns of real-world scale (rate limiters, chat apps, YouTube).'
      }
    ],
    essentialTips: [
      'Make it work, make it right, make it fast — in that exact order.',
      'Write tests for bug fixes: if a bug occurred once, ensure a unit test prevents it from ever returning.',
      'Keep interfaces small and explicit. Program to an interface, not an implementation.'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'Strategy Pattern: Decoupling authentication strategies cleanly',
      code: `from abc import ABC, abstractmethod

class AuthStrategy(ABC):
    @abstractmethod
    def authenticate(self, credentials: dict) -> bool:
        pass

class PasswordAuth(AuthStrategy):
    def authenticate(self, credentials: dict) -> bool:
        print("[PasswordAuth] Verifying bcrypt hash...")
        return credentials.get("password") == "secret123"

class TokenAuth(AuthStrategy):
    def authenticate(self, credentials: dict) -> bool:
        print("[TokenAuth] Verifying cryptographic JWT signature...")
        return bool(credentials.get("token", "").startswith("Bearer eyJ"))

class SecurityGateway:
    def __init__(self, strategy: AuthStrategy):
        self.strategy = strategy

    def login(self, creds: dict):
        if self.strategy.authenticate(creds):
            print(">>> Access Granted!")
        else:
            print(">>> Access Denied!")

# Testing different strategies with zero code changes to SecurityGateway
gateway = SecurityGateway(PasswordAuth())
gateway.login({"password": "secret123"})

gateway.strategy = TokenAuth()
gateway.login({"token": "Bearer eyJhbGciOi..."})
`
    }
  },
  {
    id: 'hero-distributed',
    subjectArea: 'Distributed Systems & Cloud Architecture',
    title: 'Consensus Protocols (Raft & Paxos), Eventual Consistency & RPCs',
    badge: 'Distributed Systems',
    overview: 'Moving beyond single-node machines to global distributed architectures. Learn how distributed consensus algorithms (Raft, Paxos) solve the two generals problem, how vector clocks order concurrent events, how leader elections work, and how gRPC protocol buffers serialize network traffic efficiently.',
    keyConcepts: [
      'CAP Theorem & PACELC: Trade-offs between Consistency, Availability, and Partition Tolerance',
      'Consensus Algorithms: Raft Leader Election, Heartbeats, Term Numbers, and Log Replication',
      'Split-Brain Prevention: Quorum majorities (N/2 + 1) to prevent divergent state forks',
      'Eventual Consistency & CRDTs: Conflict-free Replicated Data Types for collaborative software',
      'Remote Procedure Calls (RPC): gRPC, Protobuf serialization, idempotent retries, and backoff'
    ],
    keyCommands: [
      { command: 'etcdctl endpoint health', purpose: 'Checks raft consensus and cluster health across etcd nodes' },
      { command: 'grpcurl -plaintext localhost:50051 list', purpose: 'Inspects exposed gRPC services and methods in real-time' },
      { command: 'consul members', purpose: 'Lists all cluster nodes and gossip protocol membership status' }
    ],
    recommendedSources: [
      {
        title: 'Designing Data-Intensive Applications',
        authorOrPlatform: 'Martin Kleppmann (Cambridge University)',
        type: 'Book',
        url: 'https://dataintensive.net/',
        isClassic: true,
        notes: 'Chapters 8 and 9 are the definitive modern explanation of distributed time, consensus, and linearizability.'
      },
      {
        title: 'In Search of an Understandable Consensus Algorithm (Raft Paper)',
        authorOrPlatform: 'Diego Ongaro & John Ousterhout (Stanford University)',
        type: 'Paper',
        url: 'https://raft.github.io/raft.pdf',
        isClassic: true,
        notes: 'The readable landmark paper introducing the Raft consensus state machine.'
      },
      {
        title: 'MIT 6.824: Distributed Systems',
        authorOrPlatform: 'Prof. Robert Morris (MIT OpenCourseWare)',
        type: 'Course',
        url: 'https://pdos.csail.mit.edu/6.824/',
        isClassic: true,
        notes: 'Legendary MIT course with labs building Raft and a distributed key-value store in Go.'
      }
    ],
    essentialTips: [
      'Network partitions will occur: always design your state machine so nodes refuse writes rather than corrupting state (CP) or gracefully degrade (AP).',
      'Never rely on physical wall-clock time across machines; NTP drift makes physical timestamps unreliable for ordering transactions.',
      'Always implement idempotent APIs: when network timeouts occur, the client will retry, and retrying must be safe.'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'Toy Raft Consensus: Leader election and quorum vote simulation in Python',
      code: `import random

class RaftNode:
    def __init__(self, node_id, total_nodes):
        self.node_id = node_id
        self.total_nodes = total_nodes
        self.term = 0
        self.state = "Follower" # Follower, Candidate, Leader
        self.voted_for = None

    def start_election(self, peers):
        self.term += 1
        self.state = "Candidate"
        self.voted_for = self.node_id
        votes = 1
        print(f"[Node {self.node_id}] Heartbeat timed out! Starting Term {self.term} Election...")

        for peer in peers:
            if peer.node_id != self.node_id:
                # Peer grants vote if peer has not voted in this term yet
                if peer.voted_for is None or peer.term < self.term:
                    peer.term = self.term
                    peer.voted_for = self.node_id
                    votes += 1

        quorum = (self.total_nodes // 2) + 1
        print(f"[Node {self.node_id}] Received {votes}/{self.total_nodes} votes (Quorum needed: {quorum})")

        if votes >= quorum:
            self.state = "Leader"
            print(f">>> [Node {self.node_id}] Won election! State is now LEADER for Term {self.term}.")
        else:
            self.state = "Follower"
            print(f"[Node {self.node_id}] Election lost. Stepping down to Follower.")

# Create 5-node cluster
cluster = [RaftNode(i, 5) for i in range(1, 6)]
# Node 3 starts an election
cluster[2].start_election(cluster)
`
    }
  },
  {
    id: 'hero-security',
    subjectArea: 'Systems Security & Cryptography',
    title: 'Memory Corruption, Cryptographic Primitives & Zero Trust',
    badge: 'Offensive & Defensive Security',
    overview: 'Understanding how code breaks at the machine level and how mathematical cryptography protects data. Delve into stack frame memory layouts, buffer overflows, return-oriented programming (ROP), exploit mitigations (ASLR, Stack Canaries, NX/DEP), and modern cryptographic suites (AES-256-GCM, Ed25519, SHA-256).',
    keyConcepts: [
      'x86-64 Stack Frame Memory Layout: Local variables, Saved Base Pointer (RBP), Saved Return Address (RIP)',
      'Buffer Overflow Mechanics: Writing past boundaries to hijack the instruction pointer (EIP/RIP)',
      'Binary Mitigations: Stack Canaries, Non-Executable Stack (DEP/NX), Address Space Layout Randomization (ASLR)',
      'Cryptographic Primitives: Symmetric Encryption (AES-GCM), Asymmetric (RSA, ECC Curve25519), One-way Hashing (SHA-256)',
      'Integrity & Authenticity: Hash-based Message Authentication Codes (HMAC) and Public Key Infrastructure (PKI)'
    ],
    keyCommands: [
      { command: 'checksec --file=./binary', purpose: 'Audits ELF binary for security mitigations (Canaries, NX, PIE, Fortify)' },
      { command: 'gdb -q -ex "disassemble main" ./binary', purpose: 'Disassembles function prologue and epilogue to inspect stack allocation' },
      { command: 'openssl dgst -sha256 -hmac "secretkey" message.txt', purpose: 'Computes cryptographic HMAC-SHA256 signature' },
      { command: 'openssl s_client -connect google.com:443 -tls1_3', purpose: 'Validates server X.509 certificate chain and TLS 1.3 handshake' }
    ],
    recommendedSources: [
      {
        title: 'Hacking: The Art of Exploitation (2nd Edition)',
        authorOrPlatform: 'Jon Erickson (No Starch Press)',
        type: 'Book',
        url: 'https://nostarch.com/hacking2.htm',
        isClassic: true,
        notes: 'The foundational book teaching C, assembly, memory architecture, stack overflows, and debugging.'
      },
      {
        title: 'Serious Cryptography: A Practical Introduction',
        authorOrPlatform: 'Jean-Philippe Aumasson (No Starch Press)',
        type: 'Book',
        url: 'https://nostarch.com/seriouscrypto',
        isClassic: true,
        notes: 'Accessible and rigorous guide to modern ciphers, hashes, authenticated encryption, and key exchange.'
      },
      {
        title: 'PortSwigger Web Security Academy',
        authorOrPlatform: 'PortSwigger (Makers of Burp Suite)',
        type: 'Course',
        url: 'https://portswigger.net/web-security',
        isClassic: true,
        notes: 'World-class interactive free security labs covering SQL injection, authentication flaws, and SSRF.'
      }
    ],
    essentialTips: [
      'Buffer overflows occur when functions write past allocated buffer bounds; always use bounds-checked functions (snprintf vs sprintf, fgets vs gets).',
      'Never roll your own cryptography: always rely on audited, standardized libraries like libsodium, OpenSSL, or Python cryptography.',
      'Always verify authentication tags before decrypting (Encrypt-then-MAC or Authenticated Encryption like AES-GCM).'
    ],
    sampleCodeSnippet: {
      language: 'python',
      description: 'HMAC-SHA256 Cryptographic Signature & Tamper-Proof Message Verification in Python',
      code: `import hmac
import hashlib

SECRET_KEY = b"hero-super-secret-key-2026"

def sign_payload(data: str) -> str:
    """Creates a cryptographic HMAC-SHA256 signature for a message payload."""
    sig = hmac.new(SECRET_KEY, data.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{data}|{sig}"

def verify_payload(signed_msg: str) -> bool:
    """Verifies that the message was not tampered with in transit."""
    try:
        data, received_sig = signed_msg.rsplit("|", 1)
        expected_sig = hmac.new(SECRET_KEY, data.encode('utf-8'), hashlib.sha256).hexdigest()
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(received_sig, expected_sig)
    except Exception:
        return False

# 1. Honest transmission
packet = sign_payload("transfer_credits:amount=500;recipient=Alex")
print("Signed Packet:", packet)
print("Is Packet Authentic?", verify_payload(packet)) # True

# 2. Adversary attempts to tamper with the amount from 500 to 50000
tampered = packet.replace("amount=500", "amount=50000")
print("\\nTampered Packet:", tampered)
print("Is Tampered Packet Authentic?", verify_payload(tampered)) # False!
`
    }
  }
];

