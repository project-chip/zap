import os
from sys import exit
# Constant
solution_path = './test/resource/chip/chip_test.h'
test_result_path = './tmp/chip_test.h'
word_separator = "+"

solution_list = []
test_list = []
try:
    with open(solution_path) as f:
        solution_list = f.readlines()
except IOError:
    print("Failed to open solution file")
    exit(1)

try:
    with open(test_result_path) as f:
        test_list = f.readlines()
except IOError:
    print("Failed to open test file")
    exit(1)


if (len(test_list) != len(solution_list)) :
    print("Wrong number of lines in test file. Expected {0}, got {1}".format(len(solution_list), len(test_list)))
    exit(1)

for index in range(0, len(solution_list)):
    expected_words = solution_list[index].split(word_separator)
    test_words = test_list[index].split(word_separator)
    for word_index in range(0, len(expected_words)):
        if(expected_words[word_index] != test_words[word_index]):
            print("!!!!!!!Mismatch found!!!!!!\n Expected \"{0}\" got \"{1}\"\n at line : {2}".format(expected_words[word_index], test_words[word_index], index))
            exit(1)


print("All good!")
exit()

