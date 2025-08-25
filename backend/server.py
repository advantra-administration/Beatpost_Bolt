from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import uuid
from google.cloud import storage
from PIL import Image
import io
import base64
import requests
from dotenv import load_dotenv

load_dotenv()



app = FastAPI(title="Beatpost API", description="API para la plataforma de publicación Beatpost")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/beatpost")
try:
    client = MongoClient(MONGO_URL, tlsAllowInvalidCertificates=True)
    # Send a ping to confirm a successful connection
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    # Fallback to local connection
    try:
        client = MongoClient("mongodb://localhost:27017/beatpost")
        client.admin.command('ping')
        print("Connected to local MongoDB!")
    except Exception as local_e:
        print(f"Failed to connect to local MongoDB too: {local_e}")
        raise Exception("No database connection available")

db = client.beatpost

# Collections
users_collection = db.users
posts_collection = db.posts
comments_collection = db.comments
ratings_collection = db.ratings
follows_collection = db.follows

@app.on_event("startup")
def ensure_db_indexes():
    # Si la BD aún no existe, Mongo la levantará al crear estas colecciones:
    if "users" not in db.list_collection_names():
        db.create_collection("users")
    if "posts" not in db.list_collection_names():
        db.create_collection("posts")
    if "comments" not in db.list_collection_names():
        db.create_collection("comments")
    if "ratings" not in db.list_collection_names():
        db.create_collection("ratings")
    if "follows" not in db.list_collection_names():
        db.create_collection("follows")

    # Índices únicos y de consulta frecuente
    users_collection.create_index("id", unique=True)
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)

    posts_collection.create_index("id", unique=True)
    posts_collection.create_index("author_id")
    posts_collection.create_index("created_at")
    
    comments_collection.create_index("id", unique=True)
    comments_collection.create_index("post_id")
    comments_collection.create_index("author_id")
    
    ratings_collection.create_index("id", unique=True)
    ratings_collection.create_index("post_id")
    ratings_collection.create_index("user_id")
    
    follows_collection.create_index("id", unique=True)
    follows_collection.create_index("follower_id")
    follows_collection.create_index("following_id")


# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))
GCS_BUCKET = os.getenv("GCS_BUCKET_NAME")

if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set")
if not JWT_ALGORITHM:
    raise ValueError("JWT_ALGORITHM environment variable is not set")
if not JWT_ACCESS_TOKEN_EXPIRE_MINUTES:
    raise ValueError("JWT_ACCESS_TOKEN_EXPIRE_MINUTES environment variable is not set")

# Google Cloud Storage configuration (optional for development)
try:
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and GCS_BUCKET:
        # Initialize Google Cloud Storage client
        gcs_client = storage.Client()
        bucket = gcs_client.bucket(GCS_BUCKET)
        print("Google Cloud Storage initialized successfully")
    else:
        print("Google Cloud Storage not configured - image uploads will be disabled")
        gcs_client = None
        bucket = None
except Exception as e:
    print(f"Google Cloud Storage initialization failed: {e}")
    gcs_client = None
    bucket = None

# Pydantic models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    bio: Optional[str] = Field(None, max_length=500)
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str
    mojo: float = 0.0
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: datetime

class PostBase(BaseModel):
    title: str = Field(..., min_length=20, max_length=80)
    content: str = Field(..., min_length=150, max_length=10000)
    hashtags: List[str] = Field(..., min_items=1, max_items=3)
    image: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: str
    author_id: str
    author_username: str
    visits: int = 0
    average_rating: float = 0.0
    ratings_count: int = 0
    comments_count: int = 0
    archived: bool = False
    created_at: datetime
    updated_at: datetime

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class CommentCreate(CommentBase):
    post_id: str

class CommentResponse(CommentBase):
    id: str
    post_id: str
    author_id: str
    author_username: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class RatingCreate(BaseModel):
    post_id: str
    rating: int = Field(..., ge=1, le=5)

class RatingResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    rating: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

def calculate_mojo(user_id: str) -> float:
    # Get user's posts
    posts = list(posts_collection.find({"author_id": user_id}))
    publicaciones = len(posts)
    
    # Calculate average rating
    total_rating = 0
    total_visits = 0
    total_ratings = 0
    
    for post in posts:
        ratings = list(ratings_collection.find({"post_id": post["id"]}))
        if ratings:
            post_avg = sum(r["rating"] for r in ratings) / len(ratings)
            total_rating += post_avg
            total_ratings += len(ratings)
        total_visits += post.get("visits", 0)
    
    calidad_media = total_rating / publicaciones if publicaciones > 0 else 0
    visitas_totales = total_visits
    
    # Count interactions (comments + ratings)
    comments_count = comments_collection.count_documents({"author_id": user_id})
    interacciones = total_ratings + comments_count
    
    # Count followers
    seguidores = follows_collection.count_documents({"following_id": user_id})
    
    # Calculate Mojo
    mojo = (5 * publicaciones) + (10 * calidad_media) + (0.1 * visitas_totales) + (1 * interacciones) + (3 * seguidores)
    
    # Update user's mojo
    users_collection.update_one(
        {"id": user_id},
        {"$set": {"mojo": mojo}}
    )
    
    return mojo

def convert_to_bw(image_data: bytes) -> bytes:
    """Convert image to black and white"""
    image = Image.open(io.BytesIO(image_data))
    bw_image = image.convert('L')  # Convert to grayscale
    img_buffer = io.BytesIO()
    bw_image.save(img_buffer, format='JPEG')
    return img_buffer.getvalue()

# Routes
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Beatpost API - Plataforma de publicación para la generación Beat"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Check if user exists
    if users_collection.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email o username ya registrado"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "bio": user.bio,
        "avatar": user.avatar,
        "password_hash": hashed_password,
        "mojo": 0.0,
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_doc)
    
    return UserResponse(
        id=user_id,
        username=user.username,
        email=user.email,
        bio=user.bio,
        avatar=user.avatar,
        followers_count=0,
        following_count=0,
        posts_count=0,
        created_at=user_doc["created_at"]
    )

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = users_collection.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    followers_count = follows_collection.count_documents({"following_id": current_user["id"]})
    following_count = follows_collection.count_documents({"follower_id": current_user["id"]})
    posts_count = posts_collection.count_documents({"author_id": current_user["id"]})
    
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        bio=current_user.get("bio"),
        avatar=current_user.get("avatar"),
        mojo=current_user.get("mojo", 0.0),
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        created_at=current_user["created_at"]
    )

@app.put("/api/users/me", response_model=UserResponse)
async def update_user_profile(
    username: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    
    # Validate and update username if provided
    if username is not None:
        username = username.strip()
        if len(username) < 3 or len(username) > 30:
            raise HTTPException(status_code=400, detail="El nombre de usuario debe tener entre 3 y 30 caracteres")
        
        # Check if username is already taken by another user
        existing_user = users_collection.find_one({"username": username, "id": {"$ne": current_user["id"]}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Este nombre de usuario ya está en uso")
        
        update_data["username"] = username
    
    # Validate and update bio if provided
    if bio is not None:
        bio = bio.strip()
        if len(bio) > 500:
            raise HTTPException(status_code=400, detail="La biografía no puede exceder 500 caracteres")
        
        update_data["bio"] = bio if bio else None
    
    # Handle avatar upload if provided
    if avatar:
        if not bucket:
            raise HTTPException(status_code=503, detail="Servicio de imágenes no disponible")
        
        try:
            # Validate file
            if not avatar.content_type or not avatar.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="Por favor selecciona un archivo de imagen válido")
            
            if avatar.size and avatar.size > 2 * 1024 * 1024:  # 2MB limit for avatars
                raise HTTPException(status_code=400, detail="La imagen no puede exceder 2MB")
            
            # Read and process image
            image_data = await avatar.read()
            
            # Upload to GCS
            filename = f"avatars/{current_user['id']}/{uuid.uuid4()}.jpg"
            blob = bucket.blob(filename)
            blob.upload_from_string(image_data, content_type="image/jpeg")
            
            avatar_url = f"https://storage.googleapis.com/{GCS_BUCKET}/{filename}"
            update_data["avatar"] = avatar_url
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error procesando imagen: {str(e)}")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    # Update user in database
    update_data["updated_at"] = datetime.utcnow()
    users_collection.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    # Get updated user data
    updated_user = users_collection.find_one({"id": current_user["id"]})
    
    # Calculate current stats
    followers_count = follows_collection.count_documents({"following_id": current_user["id"]})
    following_count = follows_collection.count_documents({"follower_id": current_user["id"]})
    posts_count = posts_collection.count_documents({"author_id": current_user["id"]})
    
    return UserResponse(
        id=updated_user["id"],
        username=updated_user["username"],
        email=updated_user["email"],
        bio=updated_user.get("bio"),
        avatar=updated_user.get("avatar"),
        mojo=updated_user.get("mojo", 0.0),
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        created_at=updated_user["created_at"]
    )

@app.get("/api/users/{username}", response_model=UserResponse)
async def get_user_profile(username: str):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    followers_count = follows_collection.count_documents({"following_id": user["id"]})
    following_count = follows_collection.count_documents({"follower_id": user["id"]})
    posts_count = posts_collection.count_documents({"author_id": user["id"]})
    
    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        bio=user.get("bio"),
        avatar=user.get("avatar"),
        mojo=user.get("mojo", 0.0),
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        created_at=user["created_at"]
    )

@app.post("/api/posts", response_model=PostResponse)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    hashtags: str = Form(...),  # JSON string
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    import json
    
    # Parse hashtags
    try:
        hashtags_list = json.loads(hashtags)
        if not isinstance(hashtags_list, list) or len(hashtags_list) < 1 or len(hashtags_list) > 3:
            raise ValueError()
    except:
        raise HTTPException(status_code=400, detail="Hashtags debe ser una lista de 1 a 3 elementos")
    
    # Validate post data
    if len(title) < 20 or len(title) > 80:
        raise HTTPException(status_code=400, detail="El título debe tener entre 20 y 80 caracteres")
    
    if len(content) < 150 or len(content) > 10000:
        raise HTTPException(status_code=400, detail="El contenido debe tener entre 150 y 10,000 caracteres")
    
    # Handle image upload
    image_url = None
    if image:
        if not bucket:
            raise HTTPException(status_code=503, detail="Servicio de imágenes no disponible")
        
        try:
            # Read and convert image to B&W
            image_data = await image.read()
            bw_image_data = convert_to_bw(image_data)
            
            # Upload to GCS
            filename = f"posts/{uuid.uuid4()}.jpg"
            blob = bucket.blob(filename)
            blob.upload_from_string(bw_image_data, content_type="image/jpeg")
            
            # For uniform bucket-level access, we don't use make_public()
            # Instead, we construct the public URL directly
            image_url = f"https://storage.googleapis.com/{GCS_BUCKET}/{filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error procesando imagen: {str(e)}")
    
    # Create post
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "title": title,
        "content": content,
        "hashtags": hashtags_list,
        "image": image_url,
        "author_id": current_user["id"],
        "author_username": current_user["username"],
        "visits": 0,
        "archived": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    posts_collection.insert_one(post_doc)
    
    # Update user's mojo
    calculate_mojo(current_user["id"])
    
    return PostResponse(**post_doc, average_rating=0.0, ratings_count=0, comments_count=0)

@app.get("/api/posts", response_model=List[PostResponse])
async def get_posts(skip: int = 0, limit: int = 20, hashtag: Optional[str] = None):
    query = {}
    if hashtag:
        query["hashtags"] = {"$in": [hashtag]}
    
    posts = list(posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    
    result = []
    for post in posts:
        # Calculate stats
        ratings = list(ratings_collection.find({"post_id": post["id"]}))
        comments_count = comments_collection.count_documents({"post_id": post["id"]})
        
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0.0
        
        result.append(PostResponse(
            **post,
            average_rating=avg_rating,
            ratings_count=len(ratings),
            comments_count=comments_count
        ))
    
    return result

@app.get("/api/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    # Increment visits
    posts_collection.update_one({"id": post_id}, {"$inc": {"visits": 1}})
    post["visits"] += 1
    
    # Calculate stats
    ratings = list(ratings_collection.find({"post_id": post_id}))
    comments_count = comments_collection.count_documents({"post_id": post_id})
    
    avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0.0
    
    # Update author's mojo
    calculate_mojo(post["author_id"])
    
    return PostResponse(
        **post,
        average_rating=avg_rating,
        ratings_count=len(ratings),
        comments_count=comments_count
    )

@app.post("/api/posts/{post_id}/rate", response_model=RatingResponse)
async def rate_post(post_id: str, rating_data: RatingCreate, current_user: dict = Depends(get_current_user)):
    # Check if post exists
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    # Check if user already rated this post
    existing_rating = ratings_collection.find_one({"post_id": post_id, "user_id": current_user["id"]})
    
    rating_id = str(uuid.uuid4())
    rating_doc = {
        "id": rating_id,
        "post_id": post_id,
        "user_id": current_user["id"],
        "rating": rating_data.rating,
        "created_at": datetime.utcnow()
    }
    
    if existing_rating:
        # Update existing rating
        ratings_collection.update_one(
            {"post_id": post_id, "user_id": current_user["id"]},
            {"$set": {"rating": rating_data.rating, "updated_at": datetime.utcnow()}}
        )
        rating_doc["id"] = existing_rating["id"]
    else:
        # Create new rating
        ratings_collection.insert_one(rating_doc)
    
    # Update author's mojo
    calculate_mojo(post["author_id"])
    
    return RatingResponse(**rating_doc)

@app.post("/api/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, comment_data: CommentBase, current_user: dict = Depends(get_current_user)):
    # Check if post exists
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "post_id": post_id,
        "author_id": current_user["id"],
        "author_username": current_user["username"],
        "content": comment_data.content,
        "created_at": datetime.utcnow()
    }
    
    comments_collection.insert_one(comment_doc)
    
    # Update author's mojo
    calculate_mojo(current_user["id"])
    
    return CommentResponse(**comment_doc)

@app.get("/api/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    comments = list(comments_collection.find({"post_id": post_id}).sort("created_at", 1))
    return [CommentResponse(**comment) for comment in comments]

@app.put("/api/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(comment_id: str, comment_data: CommentBase, current_user: dict = Depends(get_current_user)):
    # Check if comment exists and user is the author
    comment = comments_collection.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    if comment["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este comentario")
    
    # Validate content
    if len(comment_data.content.strip()) < 1 or len(comment_data.content) > 1000:
        raise HTTPException(status_code=400, detail="El comentario debe tener entre 1 y 1000 caracteres")
    
    # Update comment
    update_data = {
        "content": comment_data.content.strip(),
        "updated_at": datetime.utcnow()
    }
    
    comments_collection.update_one({"id": comment_id}, {"$set": update_data})
    
    # Get updated comment
    updated_comment = comments_collection.find_one({"id": comment_id})
    
    return CommentResponse(**updated_comment)

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    # Check if comment exists and user is the author
    comment = comments_collection.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    if comment["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este comentario")
    
    # Delete the comment
    comments_collection.delete_one({"id": comment_id})
    
    # Update author's mojo (reduce interactions)
    calculate_mojo(current_user["id"])
    
    return {"message": "Comentario eliminado exitosamente"}

@app.post("/api/follow/{username}")
async def follow_user(username: str, current_user: dict = Depends(get_current_user)):
    # Check if target user exists
    target_user = users_collection.find_one({"username": username})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if target_user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")
    
    # Check if already following
    existing_follow = follows_collection.find_one({
        "follower_id": current_user["id"],
        "following_id": target_user["id"]
    })
    
    if existing_follow:
        # Unfollow
        follows_collection.delete_one({
            "follower_id": current_user["id"],
            "following_id": target_user["id"]
        })
        action = "unfollowed"
    else:
        # Follow
        follow_doc = {
            "id": str(uuid.uuid4()),
            "follower_id": current_user["id"],
            "following_id": target_user["id"],
            "created_at": datetime.utcnow()
        }
        follows_collection.insert_one(follow_doc)
        action = "followed"
    
    # Update target user's mojo
    calculate_mojo(target_user["id"])
    
    return {"message": f"Usuario {action} exitosamente"}

@app.get("/api/frontpage", response_model=List[PostResponse])
async def get_frontpage():
    # Get posts from last 24 hours, sorted by mojo and interactions
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    # Get all posts and calculate their "score" for frontpage
    posts = list(posts_collection.find({"created_at": {"$gte": yesterday}}).sort("created_at", -1))
    
    scored_posts = []
    for post in posts:
        # Get author's mojo
        author = users_collection.find_one({"id": post["author_id"]})
        author_mojo = author.get("mojo", 0) if author else 0
        
        # Calculate post score
        ratings = list(ratings_collection.find({"post_id": post["id"]}))
        comments_count = comments_collection.count_documents({"post_id": post["id"]})
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0
        
        score = (post["visits"] * 0.1) + (len(ratings) * 2) + (comments_count * 1.5) + (author_mojo * 0.01) + (avg_rating * 3)
        
        scored_posts.append((post, score, avg_rating, len(ratings), comments_count))
    
    # Sort by score and take top posts
    scored_posts.sort(key=lambda x: x[1], reverse=True)
    
    result = []
    for post_data in scored_posts[:10]:  # Top 10 posts
        post, _, avg_rating, ratings_count, comments_count = post_data
        result.append(PostResponse(
            **post,
            average_rating=avg_rating,
            ratings_count=ratings_count,
            comments_count=comments_count
        ))
    
    return result

@app.get("/api/ranks")
async def get_ranks(hashtag: Optional[str] = None):
    query = {}
    if hashtag:
        query["hashtags"] = {"$in": [hashtag]}
    
    posts = list(posts_collection.find(query))
    
    # Calculate rankings
    ranked_posts = []
    for post in posts:
        ratings = list(ratings_collection.find({"post_id": post["id"]}))
        comments_count = comments_collection.count_documents({"post_id": post["id"]})
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0
        
        # Ranking score
        score = (post["visits"] * 0.1) + (len(ratings) * 2) + (comments_count * 1.5) + (avg_rating * 3)
        
        ranked_posts.append({
            "post": PostResponse(
                **post,
                average_rating=avg_rating,
                ratings_count=len(ratings),
                comments_count=comments_count
            ),
            "score": score
        })
    
    # Sort by score
    ranked_posts.sort(key=lambda x: x["score"], reverse=True)
    
    return {"posts": [item["post"] for item in ranked_posts[:20]]}

@app.put("/api/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    title: str = Form(...),
    content: str = Form(...),
    hashtags: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    import json
    
    # Check if post exists and user is the author
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    if post["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este post")
    
    # Parse hashtags
    try:
        hashtags_list = json.loads(hashtags)
        if not isinstance(hashtags_list, list) or len(hashtags_list) < 1 or len(hashtags_list) > 3:
            raise ValueError()
    except:
        raise HTTPException(status_code=400, detail="Hashtags debe ser una lista de 1 a 3 elementos")
    
    # Validate post data
    if len(title) < 20 or len(title) > 80:
        raise HTTPException(status_code=400, detail="El título debe tener entre 20 y 80 caracteres")
    
    if len(content) < 150 or len(content) > 10000:
        raise HTTPException(status_code=400, detail="El contenido debe tener entre 150 y 10,000 caracteres")
    
    # Handle image upload if provided
    image_url = post.get("image")  # Keep existing image by default
    if image:
        if not bucket:
            raise HTTPException(status_code=503, detail="Servicio de imágenes no disponible")
        
        try:
            # Read and convert image to B&W
            image_data = await image.read()
            bw_image_data = convert_to_bw(image_data)
            
            # Upload to GCS
            filename = f"posts/{uuid.uuid4()}.jpg"
            blob = bucket.blob(filename)
            blob.upload_from_string(bw_image_data, content_type="image/jpeg")
            
            # For uniform bucket-level access, we don't use make_public()
            # Instead, we construct the public URL directly
            image_url = f"https://storage.googleapis.com/{GCS_BUCKET}/{filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error procesando imagen: {str(e)}")
    
    # Update post
    update_data = {
        "title": title,
        "content": content,
        "hashtags": hashtags_list,
        "updated_at": datetime.utcnow()
    }
    
    if image_url:
        update_data["image"] = image_url
    
    posts_collection.update_one({"id": post_id}, {"$set": update_data})
    
    # Get updated post
    updated_post = posts_collection.find_one({"id": post_id})
    
    # Calculate stats
    ratings = list(ratings_collection.find({"post_id": post_id}))
    comments_count = comments_collection.count_documents({"post_id": post_id})
    
    avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0.0
    
    # Update author's mojo
    calculate_mojo(current_user["id"])
    
    return PostResponse(
        **updated_post,
        average_rating=avg_rating,
        ratings_count=len(ratings),
        comments_count=comments_count
    )

@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    # Check if post exists and user is the author
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    if post["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este post")
    
    # Delete related data
    comments_collection.delete_many({"post_id": post_id})
    ratings_collection.delete_many({"post_id": post_id})
    
    # Delete the post
    posts_collection.delete_one({"id": post_id})
    
    # Update author's mojo
    calculate_mojo(current_user["id"])
    
    return {"message": "Post eliminado exitosamente"}

@app.get("/api/authors")
async def get_authors(
    skip: int = 0,
    limit: int = 20,
    sort_by: Optional[str] = None,  # mojo_desc, mojo_asc, posts_desc, posts_asc, rating_desc, rating_asc
    search: Optional[str] = None,   # search in username, bio
):
    # Build query for users who have published posts
    pipeline = [
        # Get all users who have published posts
        {"$lookup": {
            "from": "posts",
            "localField": "id",
            "foreignField": "author_id",
            "as": "posts"
        }},
        # Filter only users with posts
        {"$match": {"posts": {"$ne": []}}},
        # Add computed fields
        {"$addFields": {
            "posts_count": {"$size": "$posts"},
            "total_visits": {"$sum": "$posts.visits"}
        }}
    ]
    
    # Add search filter if provided
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        pipeline.append({
            "$match": {
                "$or": [
                    {"username": search_regex},
                    {"bio": search_regex}
                ]
            }
        })
    
    # Execute aggregation
    authors_cursor = users_collection.aggregate(pipeline)
    authors = list(authors_cursor)
    
    # Calculate additional stats for each author
    enriched_authors = []
    for author in authors:
        author_id = author["id"]
        
        # Calculate average rating
        ratings = list(ratings_collection.find({"post_id": {"$in": [post["id"] for post in author["posts"]]}}))
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0.0
        
        # Count followers
        followers_count = follows_collection.count_documents({"following_id": author_id})
        
        enriched_author = {
            "id": author["id"],
            "username": author["username"],
            "bio": author.get("bio", ""),
            "avatar": author.get("avatar"),
            "mojo": author.get("mojo", 0.0),
            "posts_count": author["posts_count"],
            "followers_count": followers_count,
            "average_rating": avg_rating,
            "total_visits": author["total_visits"],
            "ratings_count": len(ratings),
            "created_at": author["created_at"]
        }
        enriched_authors.append(enriched_author)
    
    # Apply sorting
    if sort_by == "mojo_desc":
        enriched_authors.sort(key=lambda x: x["mojo"], reverse=True)
    elif sort_by == "mojo_asc":
        enriched_authors.sort(key=lambda x: x["mojo"])
    elif sort_by == "posts_desc":
        enriched_authors.sort(key=lambda x: x["posts_count"], reverse=True)
    elif sort_by == "posts_asc":
        enriched_authors.sort(key=lambda x: x["posts_count"])
    elif sort_by == "rating_desc":
        enriched_authors.sort(key=lambda x: x["average_rating"], reverse=True)
    elif sort_by == "rating_asc":
        enriched_authors.sort(key=lambda x: x["average_rating"])
    else:
        # Default: sort by mojo descending
        enriched_authors.sort(key=lambda x: x["mojo"], reverse=True)
    
    # Apply pagination
    total = len(enriched_authors)
    paginated_authors = enriched_authors[skip:skip+limit]
    
    return {
        "authors": paginated_authors,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/hashtags")
async def get_popular_hashtags():
    # Aggregate hashtags from all posts
    pipeline = [
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    
    result = list(posts_collection.aggregate(pipeline))
    return [{"hashtag": item["_id"], "count": item["count"]} for item in result]

@app.get("/api/users/{user_id}/posts", response_model=List[PostResponse])
async def get_user_posts(
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    sort_by: Optional[str] = None,  # visits_desc, visits_asc, date_desc, date_asc, rating_desc, rating_asc
    search: Optional[str] = None,   # search in title, content, hashtags
    archived: Optional[bool] = None, # None = all, True = archived only, False = non-archived only
    current_user: dict = Depends(get_current_user)
):
    # Only allow users to see their own posts with all filters
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver estos posts")
    
    # Build query
    query = {"author_id": user_id}
    
    # Filter by archived status
    if archived is not None:
        query["archived"] = archived
    
    # Search functionality
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"title": search_regex},
            {"content": search_regex},
            {"hashtags": search_regex}
        ]
    
    # Get posts
    posts_cursor = posts_collection.find(query).skip(skip).limit(limit)
    
    # Apply sorting
    if sort_by == "visits_desc":
        posts_cursor = posts_cursor.sort("visits", -1)
    elif sort_by == "visits_asc":
        posts_cursor = posts_cursor.sort("visits", 1)
    elif sort_by == "date_desc":
        posts_cursor = posts_cursor.sort("created_at", -1)
    elif sort_by == "date_asc":
        posts_cursor = posts_cursor.sort("created_at", 1)
    else:
        # Default to most recent first
        posts_cursor = posts_cursor.sort("created_at", -1)
    
    posts = list(posts_cursor)
    
    # For rating sorting, we need to calculate ratings first
    result = []
    for post in posts:
        # Calculate stats
        ratings = list(ratings_collection.find({"post_id": post["id"]}))
        comments_count = comments_collection.count_documents({"post_id": post["id"]})
        
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0.0
        
        result.append({
            "post": PostResponse(
                **post,
                average_rating=avg_rating,
                ratings_count=len(ratings),
                comments_count=comments_count
            ),
            "avg_rating": avg_rating
        })
    
    # Apply rating sorting if requested
    if sort_by == "rating_desc":
        result.sort(key=lambda x: x["avg_rating"], reverse=True)
    elif sort_by == "rating_asc":
        result.sort(key=lambda x: x["avg_rating"])
    
    return [item["post"] for item in result]

@app.put("/api/posts/{post_id}/archive")
async def toggle_archive_post(post_id: str, current_user: dict = Depends(get_current_user)):
    # Check if post exists and user is the author
    post = posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    
    if post["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para archivar este post")
    
    # Toggle archived status
    current_archived = post.get("archived", False)
    new_archived = not current_archived
    
    posts_collection.update_one(
        {"id": post_id},
        {"$set": {"archived": new_archived, "updated_at": datetime.utcnow()}}
    )
    
    action = "archivado" if new_archived else "desarchivado"
    return {"message": f"Post {action} exitosamente", "archived": new_archived}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)