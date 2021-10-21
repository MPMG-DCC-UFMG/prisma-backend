#!/usr/bin/env python
# coding: utf-8

import json

def data_process(corpus, labels):
	pt_stopwords = nltk.corpus.stopwords.words('portuguese')
	vectorizer = CountVectorizer(analyzer='word', stop_words= pt_stopwords)
	countVector = vectorizer.fit_transform(corpus)
	vectorizer2 = TfidfTransformer(norm='l2', use_idf=False)

	X = scipy.sparse.csr_matrix.todense(vectorizer2.fit_transform(countVector))
	y = np.array(labels)

	return X, y

def get_X_y(jsonFile, annotationFile):
	
	labels = dict()
	
	if os.path.isfile(annotationFile):	
		file = open(annotationFile, "r")
		for line in file:
			if "\t" in line:
				line = line.strip().split("\t")
				labels[line[0]] = line[1]
		file.close()
	else:
		file = open(annotationFile, "w")
		file.close()

	X_ids = list()
	X = list()
	y = list()

	labeled_idx = list()
	idx = 0

	with open(jsonFile, 'r') as openfile:
		json_object = json.load(openfile)
	
	for segment in json_object["segments"]:
		ID = segment["id"]
		if len(segment["materia"]) > 40000:
			continue
		X_ids.append(ID)
		X.append(segment["materia"])
		if ID in labels:
			y.append(labels[ID])
			labeled_idx.append(idx)
		else:
			y.append(None)
		idx += 1

	y = np.array(y)
	X_values = np.array(X)
	X_ids = np.array(X_ids)
	
	X, y = data_process(X_values, y)
	
	return X, y, X_values, X_ids, labeled_idx

#X, y, X_values, X_ids, labeled_idx = get_data("data/sample_09-09.json", "results/12.tsv")



# In[22]:


# Classification
import scipy
import pickle
import pandas as pd
import numpy as np
import nltk
from sklearn import svm
from sklearn.svm import SVC
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from modAL.models import ActiveLearner
from modAL.uncertainty import uncertainty_sampling
from sklearn.model_selection import train_test_split
from threading import Thread
#import time

class Classification(object):
	
	def __init__(self, id, jsonFileName, model, strategy, n_initial, batch_size, topics, PATH_results):
		self.id = id
		self.jsonFileName = jsonFileName
		self.model = model
		self.strategy = strategy
		self.n_initial = int(n_initial)
		self.batch_size = int(batch_size)
		self.topics = topics
		self.training = False
		self.PATH_results = PATH_results
		
		self.start()
	
	def start(self):
		self.dict_ID_idx = dict()
		self.dict_ID_inst = dict()
		
		X, y, self.X_values, self.X_IDs, labeled_idx = get_X_y(self.jsonFileName, self.PATH_results + str(self.id) + ".tsv")
		
		# Rotulação inicial suficiente para gerar os conjuntos inicial e de teste
		if self.n_initial*2 <= len(labeled_idx):
				
			# Selecionando o conjunto rotulado inicial
			initial_idx = [labeled_idx[i] for i in np.random.choice(range(len(labeled_idx)), size=self.n_initial, replace=False)]
			X_initial, y_initial = X[initial_idx], y[initial_idx]

			# Checa a condição necessária de pelo menos duas classes distintas anotadas
			if len(set(y_initial)) == 1:
				self.flag_rotulosPendentes = 1
				self.accuracy_scores = []
			else:
				# Separando o conjunto de teste
				test_idx = [i for i in labeled_idx if i not in initial_idx]
				self.X_test, self.y_test = X[test_idx], y[test_idx]

				# Selecionando o conjunto de treino
				self.X_pool, self.y_pool = np.delete(X, labeled_idx, axis=0), np.delete(y, labeled_idx, axis=0)

				self.learner = ActiveLearner(
					estimator= self.model,#svm.SVC(probability=True),
					query_strategy= self.strategy,#uncertainty_sampling,
					X_training=X_initial, y_training=y_initial
				)

				self.accuracy_scores = [self.learner.score(self.X_test, self.y_test)]
				self.flag_rotulosPendentes = False
			
		# Rotula o mínimo necessário para executar o classificador
		else:
			# Seta quantas anotações são necessárias para gerar o modelo
			self.flag_rotulosPendentes = self.n_initial*2-len(labeled_idx)
			self.accuracy_scores = []
	
	def query(self):
		data = dict()
		data["segments"] = list()
		
		# Caso ainda haja pendência de anotações para gerar grupos inicial e de teste
		if self.flag_rotulosPendentes or not hasattr(self, "learner"):
			idxs = np.random.choice(range(len(self.X_values)), size=self.flag_rotulosPendentes, replace=False)
			for query_idx in idxs:
				value = self.X_values[query_idx]
				id = self.X_IDs[query_idx]
				data["segments"].append({"id": id, "materia": value})
		else:
			if (len(self.X_pool) == 0):
				data = {"status": "finished"}
			else:
				query_idx, query_inst = self.learner.query(self.X_pool)
				value = self.X_values[query_idx][0]
				id = self.X_IDs[query_idx][0]
				self.dict_ID_idx[id] = query_idx
				self.dict_ID_inst[id] = query_inst
				data = {"segments": [{"id": id, "materia": value}]}
		return data
	
	def teach(self, data):
		if not self.training:
			self.training = True
			if "results" in data:
				for p in data["results"]:
					if "id" in p and "topic" in p and "error" in p:
						# Caso ainda haja pendência de anotações para gerar grupos inicial e de teste
						if self.flag_rotulosPendentes or not hasattr(self, "learner"):
							if p["topic"] != None:
								self.flag_rotulosPendentes = self.flag_rotulosPendentes - 1
								self.write_annotation(p["id"], p["topic"], p["error"])
								if self.flag_rotulosPendentes == 0:
									self.start()
						else:
							if p["id"] in self.dict_ID_inst:
								query_inst = self.dict_ID_inst[p["id"]]
								query_idx = self.dict_ID_idx[p["id"]]

								if p["topic"] != None:
									self.write_annotation(p["id"], p["topic"], p["error"])
									y_new = np.array([p["topic"]], dtype=str)
									self.learner.teach(query_inst.reshape(1, -1), y_new)
									self.accuracy_scores.append(self.learner.score(self.X_test, self.y_test))
								del self.dict_ID_idx[p["id"]]
								del self.dict_ID_inst[p["id"]]
								self.X_pool, self.y_pool = np.delete(self.X_pool, query_idx, axis=0), np.delete(self.y_pool, query_idx, axis=0)

			self.training = False
	
	def status(self):
		ret = "ready"
		if self.training:
			ret = "running"
		
		return ret

	def editModel(self, id, jsonFileName, model, strategy, n_initial, batch_size, topics):
		self.id = id
		self.jsonFileName = jsonFileName
		self.model = model
		self.strategy = strategy
		self.n_initial = n_initial
		self.batch_size = batch_size
		self.topics = topics
		self.start()
		return "edited"
	
	def scores(self):
		return self.accuracy_scores
	
	def restart(self):
		self.training = False
		self.start()
		return "restarted"
	
	def write_annotation(self, idx, topic, segmentation):
		with open(self.PATH_results + str(self.id) + ".tsv", "a") as file:
			file.write(idx + "\t" + topic  + "\t" + str(segmentation) + "\n")


# In[23]:


import pickle
from joblib import dump, load

import flask
from flask import Response
from flask import request
import os

from modAL.uncertainty import uncertainty_sampling
from sklearn import svm
from sklearn.svm import SVC

app = flask.Flask(__name__)
port = int(os.getenv("PORT", 9099))

PATH_models = "models/"
PATH_results = "results/"
PATH_data = "data/"

dict_modelsNames = dict()
dict_modelsNames["SVM"] = svm.SVC(probability=True)

dict_strategies = dict()
dict_strategies["Uncertainty"] = uncertainty_sampling

dict_models = dict()

for f in os.listdir(PATH_models):
	if f.endswith(".joblib"):
		dict_models[f[:f.index(".")]] = load(f'models/{f}')


   
@app.route('/models', methods=['GET'])
def models():
	result = list(dict_modelsNames.keys())
	data = {'models': result}
	return flask.jsonify(data)

@app.route('/strategies', methods=['GET'])
def strategies():
	result = list(dict_strategies.keys())
	data = {'strategies': result}
	return flask.jsonify(data)

@app.route('/createModel', methods=['POST'])
def createModel():
	features = flask.request.get_json(force=True)['features']
	
	if "id" not in features or "jsonFileName" not in features or "model" not in features or "strategy" not in features or "n_initial" not in features or "batch_size" not in features or "topics" not in features:
		return Response(
			"JSON incompleto para criação do modelo.",
			status=400,
		)
	
	if str(features["id"]) in dict_models:
		return Response(
			"O modelo com identificador '" + str(features["id"]) + "' já existe.",
			status=400,
		)	
	
	if features["model"] not in dict_modelsNames:
		return Response(
			"O modelo '" + features["model"] + "' não foi implementado.",
			status=400,
		)
		
	if features["strategy"] not in dict_strategies:
		return Response(
			"A estratégia de seleção '" + features["strategy"] + "' não foi implementada.",
			status=400,
		)
	
	if not os.path.exists(PATH_data + features["jsonFileName"]):
		return Response(
			"O arquivo '" + PATH_data + features["jsonFileName"] + "' não exite.",
			status=400,
		)
	
	c = Classification(str(features["id"]), PATH_data + features["jsonFileName"], dict_modelsNames[features["model"]], dict_strategies[features["strategy"]], features["n_initial"], features["batch_size"], features["topics"], PATH_results)
	
	dump(c, f'models/{features["id"]}.joblib')
	dict_models[str(features["id"])] = c
	
	# OBS.: Talvez o correto seria padronizar tipo: json.dumps({'success':True}), 200, {'ContentType':'application/json'}
	
	response = {'return': "created"}
	return flask.jsonify(response)

@app.route('/editModel', methods=['POST'])
def editModel():
	features = flask.request.get_json(force=True)['features']
	
	if "id" not in features or "jsonFileName" not in features or "model" not in features or "strategy" not in features or "n_initial" not in features or "batch_size" not in features or "topics" not in features:
		return Response(
			"JSON incompleto para criação do modelo.",
			status=400,
		)
	
	if str(features["id"]) not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	c = dict_models[str(features["id"])]
	ret = c.editModel(str(features["id"]), PATH_data + features["jsonFileName"], dict_modelsNames[features["model"]], dict_strategies[features["strategy"]], features["n_initial"], features["batch_size"], features["topics"])
	dump(c, f'models/{features["id"]}.joblib')
	
	response = {'return': ret}
	return flask.jsonify(response)

@app.route('/status', methods=['GET'])
def status():
	id = request.args.get('id', type = str)
	
	if id is None:
		return Response(
			"Favor informar o identidificar 'id' como parâmetro na requisição.",
			status=400,
		)
	
	if id not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	response = {'status': dict_models[id].status()}
	
	return flask.jsonify(response)

@app.route('/query', methods=['GET'])
def query():
	id = request.args.get('id', type = str)
	
	if id is None:
		return Response(
			"Favor informar o identidificar 'id' como parâmetro na requisição.",
			status=400,
		)
	
	if id not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	data = dict_models[id].query()
	
	return flask.jsonify(data)

@app.route('/teach', methods=['POST'])
def teach():
	id = request.args.get('id', type = str)
	
	if id is None:
		return Response(
			"Favor informar o identidificar 'id' como parâmetro na requisição.",
			status=400,
		)
	
	if id not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	post = flask.request.get_json(force=True)
	
	Thread(target=dict_models[id].teach,args=(post,)).start()
	# Equivalente: dict_models[id].teach(post)
	
	response = {'return': "teaching"}
	return flask.jsonify(response)

@app.route('/restart', methods=['GET'])
def restart():
	id = request.args.get('id', type = str)
	
	if id is None:
		return Response(
			"Favor informar o identidificar 'id' como parâmetro na requisição.",
			status=400,
		)
	
	if id not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	ret = dict_models[id].restart()
	
	response = {'return': ret}
	return flask.jsonify(response)

@app.route('/scores', methods=['GET'])
def scores():
	id = request.args.get('id', type = str)
	
	if id is None:
		return Response(
			"Favor informar o identidificar 'id' como parâmetro na requisição.",
			status=400,
		)
	
	if id not in dict_models:
		return Response(
			"Não há modelo vinculado ao identidificar '"+ id + "'.",
			status=400,
		)
	
	scores = dict_models[id].scores()
	response = {'scores': scores}
	
	return flask.jsonify(response)

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=port)
	
	# Saving models
	for id,c in dict_models.items():
		dump(c, f'models/{id}.joblib')

