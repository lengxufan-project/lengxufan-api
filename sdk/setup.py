"""lengxufan-engine SDK 打包配置"""
from setuptools import setup, find_packages

setup(
    name="lengxufan-engine",
    version="0.1.0",
    description="AI NPC 引擎 SDK：加载 character.json 即可对话的角色引擎",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="陆银",
    license="Apache-2.0",
    packages=find_packages(),
    py_modules=["world_state", "event_bus"],
    python_requires=">=3.11",
    install_requires=[
        "Flask>=3.0",
        "chromadb>=0.4.0",
        "requests>=2.28",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
)