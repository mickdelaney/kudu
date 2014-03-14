using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using System.Text;
using Kudu.Contracts.Tracing;
using Kudu.Core.Infrastructure;
using Kudu.Services.Diagnostics;
using Moq;
using Xunit;

namespace Kudu.Services.Test
{
    public class RuntimeControllerFacts
    {
        private static readonly string _programFilesDir = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        private static readonly string _nodeDir = Path.Combine(_programFilesDir, "nodejs");
        private static readonly string _phpDir = Path.Combine(_programFilesDir, "PHP");
        private static readonly string _javaDir = Path.Combine(_programFilesDir, "Java");

        [Fact]
        public void RuntimeControllerReturnsEmptyListIfDirectoryDoesNotExist()
        {
            // Arrange
            var nodeDir = new Mock<DirectoryInfoBase>();
            nodeDir.Setup(d => d.Exists).Returns(false);
            var directory = new Mock<IDirectoryInfoFactory>();
            directory.Setup(d => d.FromDirectoryName(_nodeDir)).Returns(nodeDir.Object);
            var fileSystem = new Mock<IFileSystem>();
            fileSystem.Setup(f => f.DirectoryInfo).Returns(directory.Object);
            FileSystemHelpers.Instance = fileSystem.Object;

            // Act
            var nodeVersions = RuntimeController.GetNodeVersions();

            // Assert
            Assert.Empty(nodeVersions);
        }

        [Fact]
        public void RuntimeControllerReturnsNodeVersions()
        {
            // Arrange
            var nodeDir = new Mock<DirectoryInfoBase>();
            nodeDir.Setup(d => d.Exists).Returns(true);
            nodeDir.Setup(d => d.GetDirectories()).Returns(new[] { 
                CreateDirectory("0.8.19", CreateFile("npm.txt", "1.2.8")), 
                CreateDirectory("0.10.5", CreateFile("npm.txt", "1.3.11")), 
                CreateDirectory("0.10.18"), 
                CreateDirectory("node_modules"), 
                CreateDirectory("docs") 
            });
            var directoryInfo = new Mock<IDirectoryInfoFactory>();
            directoryInfo.Setup(d => d.FromDirectoryName(_nodeDir)).Returns(nodeDir.Object);
            var fileSystem = new Mock<IFileSystem>();
            fileSystem.Setup(f => f.DirectoryInfo).Returns(directoryInfo.Object);
            FileSystemHelpers.Instance = fileSystem.Object;

            // Act
            var nodeVersions = RuntimeController.GetNodeVersions();

            // Assert
            Assert.Equal(new[] { "0.8.19", "0.10.5", "0.10.18" }, nodeVersions);
        }

        [Fact]
        public void RuntimeControllerReturnsNetFrameworkVersions()
        {
            // Act
            var clrVersions = RuntimeController.GetNetFrameworkVersions();

            // Assert
            Assert.Equal(new[] { "v2.0", "v4.0" }, clrVersions);
        }

        [Fact]
        public void RuntimeControllerReturnsPhpVersions()
        {
            var phpDir = new Mock<DirectoryInfoBase>();
            phpDir.Setup(d => d.Exists).Returns(true);
            phpDir.Setup(d => d.GetDirectories()).Returns(new[] { 
                CreateDirectory("v5.3"), 
                CreateDirectory("v5.4"), 
                CreateDirectory("v5.5"),
                CreateDirectory("v1.Foo"), 
                CreateDirectory("vBar") 
            });
            var directoryInfo = new Mock<IDirectoryInfoFactory>();
            directoryInfo.Setup(d => d.FromDirectoryName(_phpDir)).Returns(phpDir.Object);
            var fileSystem = new Mock<IFileSystem>();
            fileSystem.Setup(f => f.DirectoryInfo).Returns(directoryInfo.Object);
            FileSystemHelpers.Instance = fileSystem.Object;

            // Act
            var phpVersions = RuntimeController.GetPhpVersions();

            // Assert
            Assert.Equal(new[] { String.Empty, "5.3", "5.4", "5.5" }, phpVersions);
        }

        [Fact]
        public void RuntimeControllerReturnsJavaVersions()
        {
            var javaDir = new Mock<DirectoryInfoBase>();
            javaDir.Setup(d => d.Exists).Returns(true);
            javaDir.Setup(d => d.GetDirectories()).Returns(new[] { 
                CreateDirectory("jdk1.7.0_51"), 
                CreateDirectory("v5.5"),
                CreateDirectory("jdk1.Foo"),
                CreateDirectory("jdkBar")
            });
            var directoryInfo = new Mock<IDirectoryInfoFactory>();
            directoryInfo.Setup(d => d.FromDirectoryName(_javaDir)).Returns(javaDir.Object);
            var fileSystem = new Mock<IFileSystem>();
            fileSystem.Setup(f => f.DirectoryInfo).Returns(directoryInfo.Object);
            FileSystemHelpers.Instance = fileSystem.Object;

            // Act
            var javaVersions = RuntimeController.GetJavaVersions();

            // Assert
            Assert.Equal(new[] { String.Empty, "1.7.0_51" }, javaVersions);
        }

        [Fact]
        public void RuntimeControllerReturnsJavaContainerVersions()
        {
            var javaDir = new Mock<DirectoryInfoBase>();
            javaDir.Setup(d => d.Exists).Returns(true);
            javaDir.Setup(d => d.GetDirectories()).Returns(new[] { 
                CreateDirectory("apache-tomcat-7.0.50"), 
                CreateDirectory("apache-tomcat-7.0.51"), 
                CreateDirectory("jetty-distribution-9.1.0.v20131115"),
                CreateDirectory("jetty-distribution-9.2.0.v20140312")
            });
            javaDir.Setup(d => d.GetDirectories(It.IsAny<string>())).Returns<string>(searchPattern => 
            {
                var filter = searchPattern.Replace("*", String.Empty);
                var results = new List<DirectoryInfoBase>();
                foreach (var dir in javaDir.Object.GetDirectories())
                {
                    if (dir.Name.IndexOf(filter, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        results.Add(dir);
                    }
                }
                return results.ToArray();
            });
            var directoryInfo = new Mock<IDirectoryInfoFactory>();
            directoryInfo.Setup(d => d.FromDirectoryName(_programFilesDir)).Returns(javaDir.Object);
            var fileSystem = new Mock<IFileSystem>();
            fileSystem.Setup(f => f.DirectoryInfo).Returns(directoryInfo.Object);
            FileSystemHelpers.Instance = fileSystem.Object;

            // Act
            var javaContainerVersions = RuntimeController.GetJavaContainerVersions();

            // Assert
            Assert.Equal(new[] { "7.0.50", "7.0.51" }, javaContainerVersions["Tomcat"]);
            Assert.Equal(new[] { "9.1.0.20131115", "9.2.0.20140312" }, javaContainerVersions["Jetty"]);
        }

        private DirectoryInfoBase CreateDirectory(string name, params FileInfoBase[] files)
        {
            var dir = new Mock<DirectoryInfoBase>();
            dir.SetupGet(d => d.Name).Returns(name);
            dir.Setup(d => d.GetFiles(It.IsAny<string>())).Returns(files);
            return dir.Object;
        }

        private FileInfoBase CreateFile(string fileName, string content)
        {
            var file = new Mock<FileInfoBase>();
            file.SetupGet(f => f.Name).Returns(fileName);
            var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            file.Setup(f => f.OpenRead()).Returns(memoryStream);
            return file.Object;
        }
    }
}
