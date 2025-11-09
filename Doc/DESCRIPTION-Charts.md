# Description of charts
## Positioning
```
 \/ offset.left            \/ offset.right
+---+---------------------+---+ 
|   |       Header        |   | <- offset.top
+---+---------------------+---+
|   |                     |   |
|   |                     |   |
|   |       Contents      |   |
|   |                     |   |
|   |                     |   |
+---+---------------------+---+
|   |        Bottom       |   | <- offset.bottom
+---+---------------------+---+
|< - - - - -width- - - - - -->|
```
```
Content = 'CandleStickChart' | ...
```
Operations at Header, Bottom, Left, Right will be ignored.
## ChartContainer
Positions passed to components is relative to the component itself.