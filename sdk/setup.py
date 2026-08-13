from setuptools import setup, find_packages

setup(
    name="lengxufan-engine",
    version="0.1.0",
    description="冷旭帆AI NPC引擎——混合架构情感引擎。用代码管'里子'，AI管'面子'。",
    author="陆银",
    author_email="yingying-dev@github.com",
    url="https://github.com/lengxufan-project/lengxufan-api",
    packages=find_packages(),
    py_modules=["world_state", "event_bus"],
    include_package_data=True,
    install_requires=[
        "Flask>=3.0",
        "requests>=2.28",
        "PyYAML>=6.0",
        "chromadb>=0.4.0",
        "flask-cors>=4.0",
        "flask-sqlalchemy>=3.0",
    ],
    python_requires=">=3.11",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Games/Entertainment :: Simulation",
    ],
)
