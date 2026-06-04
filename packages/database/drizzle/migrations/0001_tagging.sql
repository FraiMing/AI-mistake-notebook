CREATE TABLE Tag (
  id integer PRIMARY KEY AUTOINCREMENT,
  
ame text NOT NULL,
  	ype text NOT NULL,
  userId integer NOT NULL REFERENCES User(id),
  createdAt integer NOT NULL
);

CREATE TABLE ProblemTag (
  problemId integer NOT NULL REFERENCES Problem(id),
  	agId integer NOT NULL REFERENCES Tag(id),
  PRIMARY KEY (problemId, 	agId)
);