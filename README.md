## codebase.app

Both of the tasks below must be done at the same level as the `pom.xml` file. This is important for maven to be able to install read the project configuration.

### Build: 
```
mvn clean package assembly:single
```

### run
```
java -jar target/app-1.0-SNAPSHOT-jar-with-dependencies.jar
```

### Settings

Settings live in `config.toml`, which must also be in the same directory as the jarfile.

{
    id: '2',
    title: 'Reverse a Linked List',
    description: 'Given the head of a singly linked list, reverse the list and return the new head.',
    file : 'foo.py',
    bounds : (10,20),
}