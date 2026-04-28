
create table Users
(
	user_id int IDENTITY(1,1) primary key,
	user_name varchar(30) NOT NULL UNIQUE,
	user_email varchar(50) NOT NULL UNIQUE,
	user_password varchar(255) NOT NULL,
	user_role int NOT NULL,
	created_at datetime DEFAULT GETDATE(),
	last_login datetime NULL
);
create table Project
(
	project_id int IDENTITY(1,1) primary key,
	project_name varchar(255) NOT NULL UNIQUE,
	project_year	varchar(4) NOT NULL,
	project_semester varchar(20) NOT NULL,
	project_sponsor varchar(100),
	sponsor_number  varchar(25),
	project_advisor INT,
	project_description varchar(500),
	created_at datetime DEFAULT GETDATE(),
	FOREIGN KEY (project_advisor) REFERENCES Users(user_id)
);
create table Meeting
(
	meeting_id int IDENTITY(1,1) primary key,
	meeting_start datetime,
	meeting_end datetime,
	created_at datetime DEFAULT GETDATE(),
	project_id int foreign key references Project(project_id)
);

create table Transcript
(
	transcript_id int IDENTITY(1,1) primary key,
	transcript_name varchar(260), 
	created_at datetime DEFAULT GETDATE(),
	meeting_id int foreign key references Meeting(meeting_id)
);


create table AuditLog
(
	log_id int IDENTITY(1,1) primary key,
	action_type varchar(255),
	entity_id	int,
	entity_name varchar(255),
	entity_type varchar(255),
	entity_before varchar(255),
	entity_after varchar(255),
	created_at datetime DEFAULT GETDATE(),
	user_id int foreign key references Users(user_id)
);

create table Report
(
	report_id int IDENTITY(1,1) primary key,
	report_description varchar(500),
	report_risk_score int,
	created_at datetime DEFAULT GETDATE(),
	meeting_id int foreign key references Meeting(meeting_id)
);

create table Risk
(
	risk_id int IDENTITY(1,1),
	report_id int,
	risk_description varchar(500) NOT NULL,
	flag_type varchar(50) NOT NULL,
	transcript_excerpt varchar(4000) NOT NULL,
	confidence_score int NOT NULL,
	status varchar(50) default 'pending',
	reviewed_by int,
	reviewed_at datetime,

	primary key (risk_id),

	FOREIGN KEY (report_id) REFERENCES Report(report_id),
	FOREIGN KEY (reviewed_by) REFERENCES Users(user_id)
);
