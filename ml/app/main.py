from fastapi import FastAPI


app = FastAPI()

@app.post("/api/v1/recognize")
async def recognize(item):
    try:
        return {"result": "OK"}
    except Exception as e:
        print(e)
