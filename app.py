import datetime
from flask import Flask, logging, request,session
from entity import *
from api.v1 import api
from flask_jwt_extended import JWTManager, get_jwt,verify_jwt_in_request,get_jwt_identity
from flask_cors import CORS

from util.reponse import Response


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///huixue.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
api.init_app(app)

CORS(app)

# 配置jwt鉴权验证
app.config['SECRET_KEY'] = 'abc'
jwt = JWTManager(app)

exculde_prefixes = [
    '/api/user/login',
    '/api/user/register',
    '/'
]

@app.before_request
def foo_request():
    url = request.path
    now_time = datetime.datetime.now()
    print(f"{now_time}->access interface:{url}")

    # 如果是 OPTIONS 请求（CORS 预检请求），直接返回 None 让 Flask-CORS 处理
    if request.method == 'OPTIONS':
        return None # 关键修改：对于 OPTIONS 请求，不返回任何响应，让 CORS 处理

    if url == '/swagger.json' or url == '/' or url.startswith('/swaggerui') : return # 如果是文档访问，则不进行token验证
    for prefix in exculde_prefixes:
        if prefix in url: return

    try:
        verify_jwt_in_request()
        msg = get_jwt()
        session['user'] = {'email':msg.get('sub'), 'id':msg.get('id')}
        return
    except Exception as e:
        return Response.UNAUTHORIZED()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        app.run()



from util.reponse import *
from flask_restx import Namespace, Resource, fields
from flask import  request
from flask_jwt_extended import jwt_required 