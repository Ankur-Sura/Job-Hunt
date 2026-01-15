#!/usr/bin/env python3
"""
===================================================================================
                    TEST_GRAPH.PY - Test Interview Prep Graph
===================================================================================

📖 WHAT IS THIS FILE?
---------------------
Test script to directly test the interview preparation LangGraph workflow.
This is useful for debugging and verifying the graph works correctly.

🔗 HOW IT WORKS:
----------------
1. Loads environment variables (.env file)
2. Imports and builds the interview prep graph
3. Creates a test initial state
4. Invokes the graph
5. Measures execution time
6. Prints success status

📌 USAGE:
---------
Run this script directly to test the graph:
    python test_graph.py

===================================================================================
"""

# Line 1: Shebang line - tells system to use Python 3 interpreter
#!/usr/bin/env python3
# Line 2: Docstring describing the file's purpose
"""Test interview prep graph directly"""
# Line 3: Import load_dotenv function from dotenv package
# This function loads environment variables from .env file
from dotenv import load_dotenv
# Line 4: Call load_dotenv() to load environment variables
# This makes variables like OPENAI_API_KEY, TAVILY_API_KEY available
load_dotenv()

# Line 6: Import build_interview_prep_graph function from interview_prep_graph module
# This function creates and returns the compiled LangGraph workflow
from interview_prep_graph import build_interview_prep_graph
# Line 7: Import time module for measuring execution time
import time
# Line 8: Import sys module for system-specific parameters and functions
import sys

# Line 10: Print message indicating graph is being built
# flush=True ensures output is immediately displayed (not buffered)
print('Building graph...', flush=True)
# Line 11: Call build_interview_prep_graph() to create the graph
# This compiles all nodes and edges into a runnable graph
graph = build_interview_prep_graph()
# Line 12: Print message indicating graph build is complete
print('Graph built!', flush=True)

# Line 14: Create initial state dictionary for the graph
# This is the input data that the graph will process
initial_state = {
    'messages': [],  # Empty messages list (not used in interview prep graph)
    'resume_data': {'skills': ['Python', 'JavaScript']},  # Mock resume data with skills
    'job_data': {'title': 'SDE', 'company': 'Google', 'description': 'Build systems'},  # Mock job data
    'application_id': 'test',  # Test application ID
    'company_info': None,  # Will be populated by company_research_node
    'interview_links': None,  # Will be populated by company_research_node
    'role_level': None,  # Will be populated by interview_rounds_analyzer_node
    'interview_rounds': None,  # Will be populated by interview_rounds_analyzer_node
    'dsa_prep': None,  # Will be populated by round_by_round_prep_node
    'system_design_prep': None,  # Will be populated by round_by_round_prep_node
    'behavioral_prep': None,  # Will be populated by round_by_round_prep_node
    'common_questions': None,  # Will be populated by common_questions_generator_node
    'prepared_answers': None,  # Not used in current implementation
    'final_guide': None  # Not used in current implementation (removed per user request)
}

# Line 31: Print message indicating graph execution is starting
print('Starting graph...', flush=True)
# Line 32: Flush stdout buffer to ensure message is displayed immediately
sys.stdout.flush()
# Line 33: Record start time before graph execution
# time.time() returns current Unix timestamp in seconds
start = time.time()
# Line 34: Invoke the graph with initial state
# graph.invoke() runs the entire workflow synchronously
# This will execute all nodes: company_research → rounds_analyzer → round_prep → questions_generator
result = graph.invoke(initial_state)
# Line 35: Calculate elapsed time by subtracting start time from current time
elapsed = time.time() - start
# Line 36: Print execution time in seconds with 2 decimal places
print(f'Done in {elapsed:.2f}s', flush=True)
# Line 37: Print success status based on whether final_guide exists in result
# bool(result.get("final_guide")) returns True if final_guide exists, False otherwise
print(f'Success: {bool(result.get("final_guide"))}', flush=True)

