from util.reponse import Response
from flask_restx import Namespace, Resource, fields
from flask import  request
from flask_jwt_extended import jwt_required

# ... existing code ...

@user_ns.route('/current')
class CurrentUser(Resource):
    # ...
    def get(self):
        try:
            token = request.headers.get('Authorization')
            if not token:
                return Response.UNAUTHORIZED()
            user_service = UserService()
            user_data = user_service.get_current_user(token)
            return Response.SUCCESS(user_data) # <--- 关键修改
        except Exception as e:
            return Response.SEVER_ERROR(str(e)) 