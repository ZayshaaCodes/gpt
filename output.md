createFile("tic_tac_toe.py", "")

board = [[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']]

def display_board(board):
    shell(f"echo '{board[0][0]} | {board[0][1]} | {board[0][2]}'")
    shell("echo ---------")
    shell(f"echo '{board[1][0]} | {board[1][1]} | {board[1][2]}'")
    shell("echo ---------")
    shell(f"echo '{board[2][0]} | {board[2][1]} | {board[2][2]}'")

def player_input():
    marker = ""
    while marker != "X" and marker != "O":
        marker = input("Player 1, choose X or O: ").upper()
    if marker == "X":
        return ("X", "O")
    else:
        return ("O", "X")

def place_marker(board, marker, position):
    if position <= 3:
        board[0][position-1] = marker
    elif position <= 6:
        board[1][position-4] = marker
    else:
        board[2][position-7] = marker