from setuptools import setup, find_packages

with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

with open('requirements.txt', 'r', encoding='utf-8') as f:
    requirements = f.read().splitlines()

setup(
    name='lingxi',
    version='0.1.0',
    description='灵犀智能任务处理系统',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='Lingxi Team',
    author_email='team@lingxi.com',
    url='https://github.com/lingxi-team/lingxi',
    packages=find_packages(),
    package_data={
        'lingxi': ['../config.yaml'],
    },
    include_package_data=True,
    install_requires=requirements,
    entry_points={
        'console_scripts': [
            'lingxi=lingxi.__main__:main',
        ],
    },
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
    python_requires='>=3.8',
)