from util.reponse import *
from flask_restx import Namespace, Resource, fields, Api
from flask import  request
from flask_jwt_extended import jwt_required

from .user import user_ns  # 假设 user_ns 在 user.py 中定义和导出
# from .grade import grade_ns # 如果有其他命名空间，也需要导入
# from .exam import exam_ns
# ... 导入其他命名空间

api = Api(
    version='1.0',
    title='慧学 API 接口文档',
    description='API 文档描述',
    # 在这里不设置 prefix，因为它通常在 app.py 中通过蓝图挂载或直接 init_app 处理
)

api.add_namespace(user_ns, path='/user')
# api.add_namespace(grade_ns, path='/grade') # 注册其他命名空间
# api.add_namespace(exam_ns, path='/exam') 