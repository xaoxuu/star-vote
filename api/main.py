# -*- coding:utf-8 -*-
import uvicorn
import json
from fastapi import FastAPI,Response, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2
import math
from urllib.parse import urlparse
app = FastAPI(docs_url=None, redoc_url=None)

allowedHosts = os.getenv("ALLOWED_HOSTS")
databaseUrl = os.getenv("DATABASE_URL") 
amdinPWD = os.getenv("ADMIN_PWD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=str(True),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/rating/update", response_class=Response)
def updateRating(request: Request, response: Response,id: str = "",value: str = ""):
    if not checkReferer(request):
        response.status_code = 403
        return
    connection = None
    cursor = None
    
    if id == "" or value == "":
        response.status_code = 400
        return json.dumps({"code": 400, "message": "Bad Request"})
    value = float(value)
    if value < 1 or value > 5:
        response.status_code = 400
        return json.dumps({"code": 400, "message": "Bad Request"})
    # 将对应的id和value插入到数据库中
    try:
        connection = psycopg2.connect(databaseUrl)
        cursor = connection.cursor()
        value = math.ceil(value)

        # 为对应的更新，若没有则新建
        sql = f"""
            INSERT INTO rating (id, "{value}") VALUES (%s, 1)
            ON CONFLICT (id) DO UPDATE SET
            "{value}" = rating."{value}" + 1, updated_at = CURRENT_TIMESTAMP;
        """
        cursor.execute(sql, (id,))
        connection.commit()
        return json.dumps({"success": "true"})


    except psycopg2.Error as e:
        if connection:
            connection.rollback()  # 在发生错误时回滚事务
        print(f"Database error during rating update: {e}")
        return json.dumps({"code": 400, "message": "Database error during rating update."})
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
    


@app.post("/api/vote/update", response_class=Response)
def updateVote(request: Request, response: Response, id: str = "", value: str = ""):
    if not checkReferer(request):
        response.status_code = 403
        return
    connection = None
    cursor = None

    if id == "" or value not in ["up", "down"]:
        response.status_code = 400
        return json.dumps({"code": 400, "message": "Bad Request"})

    try:
        connection = psycopg2.connect(databaseUrl)
        cursor = connection.cursor()

        sql = f"""
            INSERT INTO vote (id, {value}) VALUES (%s, 1)
            ON CONFLICT (id) DO UPDATE SET
            {value} = vote.{value} + 1, updated_at = CURRENT_TIMESTAMP;
        """
        cursor.execute(sql, (id,))
        connection.commit()
        return json.dumps({"success": "true"})

    except psycopg2.Error as e:
        if connection:
            connection.rollback()
        print(f"Database error during vote update: {e}")
        response.status_code = 500
        return json.dumps({"code": 500, "message": "Database error during vote update."})

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/api/vote/info", response_class=Response)
def getVoteInfo(request: Request, response: Response, id: str = "default"):
    if not checkReferer(request):
        response.status_code = 403
        return
    connection = None
    cursor = None
    try:
        connection = psycopg2.connect(databaseUrl)
        cursor = connection.cursor()
        sql = "SELECT up, down, created_at, updated_at FROM vote WHERE id = %s"
        cursor.execute(sql, (id,))
        result = cursor.fetchone()
        if result:
            vote_data = {
                "id": id,
                "up": result[0],
                "down": result[1],
                "createdAt": result[2].isoformat().replace('+00:00', 'Z'),
                "updatedAt": result[3].isoformat().replace('+00:00', 'Z'),
            }
            return json.dumps({"votes": vote_data})
        else:
            default_vote = {
                "id": id,
                "up": 0,
                "down": 0,
                "createdAt": None,
                "updatedAt": None,
            }
            return json.dumps({"votes": default_vote})

    except psycopg2.Error as e:
        print(f"Database error during vote info retrieval: {e}")
        response.status_code = 500
        return json.dumps({"code": 500, "message": "Database error"})
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/api/rating/info", response_class=Response)
def getRatingInfo(request: Request, response: Response, id: str = "default"):
    if not checkReferer(request):
        response.status_code = 403
        return
    connection = None
    cursor = None
    try:
        connection = psycopg2.connect(databaseUrl)
        cursor = connection.cursor()
        sql = 'SELECT "1", "2", "3", "4", "5", created_at, updated_at FROM rating WHERE id = %s'
        cursor.execute(sql, (id,))
        result = cursor.fetchone()
        
        if result:
            rating_data = {
                "1": result[0],
                "2": result[1],
                "3": result[2],
                "4": result[3],
                "5": result[4],
                "createdAt": result[5].isoformat().replace('+00:00', 'Z'),
                "updatedAt": result[6].isoformat().replace('+00:00', 'Z'),
                "id": id
            }
            return json.dumps({"rating": rating_data})
        else:
            # If no record is found, return a default structure with all counts as 0.
            default_rating = {
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
                "createdAt": None,
                "updatedAt": None,
                "id": id
            }
            return json.dumps({"rating": default_rating})

    except psycopg2.Error as e:
        print(f"Database error during rating info retrieval: {e}")
        response.status_code = 500
        return json.dumps({"code": 500, "message": "Database error"})
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/", response_class=Response)
def index():
    return "Hello World"


@app.get("/api/init", response_class=Response)
def init(pwd: str = ""):
    if pwd != amdinPWD:
        return json.dumps({"code": 401, "message": "Unauthorized"})

    # 链接数据库初始化
    connection = None
    cursor = None
    try:
        connection = psycopg2.connect(databaseUrl)
        cursor = connection.cursor()

        # 创建两张数据表
        # 一张是 rating，包括 id (string) 和 value (int)
        # 另一张是 vote，包括 id (string) 和 up (int) 和 down (int)
        sql = """
            CREATE TABLE IF NOT EXISTS rating (
                id VARCHAR(255) PRIMARY KEY,
                "1" INTEGER NOT NULL DEFAULT 0,
                "2" INTEGER NOT NULL DEFAULT 0,
                "3" INTEGER NOT NULL DEFAULT 0,
                "4" INTEGER NOT NULL DEFAULT 0,
                "5" INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS vote (
                id VARCHAR(255) PRIMARY KEY,
                up INTEGER NOT NULL DEFAULT 0,
                down INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """
        cursor.execute(sql)
        connection.commit()
        return json.dumps({"code": 200, "message": "Database tables created successfully"})
    except psycopg2.Error as e:
        if connection:
            connection.rollback()  # 在发生错误时回滚事务
        print(f"Database error during initialization: {e}")
        return json.dumps({"code": 500, "message": f"Database initialization error: {str(e)}"})
    except Exception as e:
        print(f"General error during initialization: {e}")
        return json.dumps({"code": 500, "message": f"An unexpected error occurred during initialization: {str(e)}"})
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def checkReferer(request):
    referer = request.headers.get("referer")
    # print(request.headers)
    if not referer:
        return False
    hostname = urlparse(referer).hostname
    # 检查主机名是否在允许的域名列表中
    for allowed_host in allowedHosts:
        if hostname.endswith(allowed_host):
            return True


if __name__ == "__main__":
        uvicorn.run("main:app", host="0.0.0.0", reload=True)
        # uvicorn.run("main:app", host="0.0.0.0", reload=True,port=18081)
