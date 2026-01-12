# Generate dashboard token 
kubectl -n kubernetes-dashboard create token admin-user

cd "C:\Users\harou\source\repos\first.kubernetes"
docker build -t first-kubernetes:latest -f first.kubernetes/Dockerfile .


# Appliquer les configurations
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Vérifier le déploiement
kubectl get deployments
kubectl get pods
kubectl get services

# Voir les logs
kubectl logs -l app=first-kubernetes

# Décrire un pod pour voir les erreurs
kubectl describe pod -l app=first-kubernetes

# Voir les événements
kubectl get events --sort-by=.metadata.creationTimestamp

# Port-forward pour tester directement
kubectl port-forward service/first-kubernetes-service 8080:8080

# Scale
kubectl scale deployment first-kubernetes --replicas=1