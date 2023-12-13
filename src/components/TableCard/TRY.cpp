#include <iostream.h> 
#include<conio.h> 
void main()
{
    clrscr();
    int n, i, j, k[100][100], m[100], c[100], C[100];
    cout << "ENTER PLAIN TEXT SIZE=";
    cin >> n;
    cout << "\ENTER PLAIN TEXT=";
    for (i = 1; i <= n; i++)
        cin >> m[i];
    cout << "\nENTER KEY MATRIX=";
    for (i = 1; i <= n; i++)
    {
        for (j = 1; j <= n; j++)
        {
            cin >> k[i][j];
        }
    }
    C[1] = 0;
    C[2] = 0;
    C[3] = 0;
    for (i = 1; i <= n; i++)
    {
        for (j = 1; j <= n; j++)
        {
            C[i] = C[i] + k[i][j] * m[j];
        }
    }
    for (i = 1; i <= n; i++)
        c[i] = C[i] % 26;
    cout << "\nCIPHER TEXT IS=";
    for (i = 1; i <= n; i++)
        cout << " " << c[i];
    getch();
}
